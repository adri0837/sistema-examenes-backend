import prisma from '../../config/prisma';

const PUNTAJE_MAXIMO = 100;

const limitarCalificacion = (puntaje: number) =>
    Math.min(Math.max(0, puntaje), PUNTAJE_MAXIMO);

export const listarExamenesDisponiblesService = async (estudiante_id: string) => {
    const examenes = await prisma.examen.findMany({
        where: { publicado: true },
        include: {
            categoria: { select: { id: true, nombre: true } },
            _count: { select: { preguntas: true } },
        },
        orderBy: { creado_en: 'desc' },
    });

    const intentos = await prisma.intento.findMany({
        where: { estudiante_id },
        select: { id: true, examen_id: true, estado: true, calificacion_final: true },
    });

    const intentosMap = new Map(intentos.map(i => [i.examen_id, i]));

    return examenes.map(examen => ({
        ...examen,
        intento: intentosMap.get(examen.id) || null,
    }));
};

export const iniciarExamenService = async (estudiante_id: string, examen_id: string) => {
    const examen = await prisma.examen.findUnique({ where: { id: examen_id } });
    if (!examen) throw new Error('Examen no encontrado');
    if (!examen.publicado) throw new Error('El examen no está disponible');

    const intentoExistente = await prisma.intento.findUnique({
        where: { estudiante_id_examen_id: { estudiante_id, examen_id } },
    });
    if (intentoExistente) throw new Error('Ya realizaste este examen');

    const intento = await prisma.intento.create({
        data: { estudiante_id, examen_id, estado: 'EN_PROGRESO' },
    });

    const preguntas = await prisma.pregunta.findMany({
        where: { examen_id },
        orderBy: { orden: 'asc' },
        include: {
            opciones: { select: { id: true, texto: true, orden: true }, orderBy: { orden: 'asc' } },
            pares: { select: { id: true, lado_izquierdo: true, lado_derecho: true, orden: true }, orderBy: { orden: 'asc' } },
            espacios: { select: { id: true, numero_espacio: true }, orderBy: { numero_espacio: 'asc' } },
        },
    });

    return { intento, examen, preguntas };
};

export const entregarExamenService = async (
    intento_id: string,
    estudiante_id: string,
    respuestas: {
        pregunta_id: string;
        texto_respuesta?: string;
        opciones_seleccionadas?: string[];
        pares_relacionados?: { izquierdo: string; derecho: string }[];
        espacios_respuestas?: string[];
    }[]
) => {
    const intento = await prisma.intento.findUnique({
        where: { id: intento_id },
        include: { examen: true },
    });
    if (!intento) throw new Error('Intento no encontrado');
    if (intento.estudiante_id !== estudiante_id) throw new Error('No autorizado');
    if (intento.estado !== 'EN_PROGRESO') throw new Error('Este examen ya fue entregado');

    const preguntas = await prisma.pregunta.findMany({
        where: { examen_id: intento.examen_id },
        include: {
            opciones: true,
            pares: true,
            espacios: true,
        },
    });

    let calificacion_auto = 0;
    let tiene_abiertas = false;

    const respuestasData = respuestas.map(r => {
        const pregunta = preguntas.find(p => p.id === r.pregunta_id);
        if (!pregunta) return null;

        let es_correcta: boolean | null = null;
        let puntaje_obtenido = 0;

        if (pregunta.tipo === 'OPCION_MULTIPLE' || pregunta.tipo === 'VERDADERO_FALSO') {
            const correctas = pregunta.opciones.filter(o => o.es_correcta).map(o => o.id).sort();
            const seleccionadas = (r.opciones_seleccionadas || []).sort();
            es_correcta = JSON.stringify(correctas) === JSON.stringify(seleccionadas);
            if (es_correcta) {
                puntaje_obtenido = Number(pregunta.puntaje);
                calificacion_auto += puntaje_obtenido;
            }
        } else if (pregunta.tipo === 'RELACIONAR') {
            const correctos = pregunta.pares.map(p => `${p.lado_izquierdo}|${p.lado_derecho}`).sort();
            const dados = (r.pares_relacionados || []).map((p: any) => `${p.izquierdo}|${p.derecho}`).sort();
            es_correcta = JSON.stringify(correctos) === JSON.stringify(dados);
            if (es_correcta) {
                puntaje_obtenido = Number(pregunta.puntaje);
                calificacion_auto += puntaje_obtenido;
            }
        } else if (pregunta.tipo === 'COMPLETAR') {
            const correctos = pregunta.espacios.map(e => e.respuesta_correcta.toLowerCase().trim());
            const dados = (r.espacios_respuestas || []).map((e: string) => e.toLowerCase().trim());
            es_correcta = JSON.stringify(correctos) === JSON.stringify(dados);
            if (es_correcta) {
                puntaje_obtenido = Number(pregunta.puntaje);
                calificacion_auto += puntaje_obtenido;
            }
        } else if (pregunta.tipo === 'ABIERTA') {
            tiene_abiertas = true;
            es_correcta = null;
        }

        return {
            intento_id,
            pregunta_id: r.pregunta_id,
            texto_respuesta: r.texto_respuesta || null,
            opciones_seleccionadas: r.opciones_seleccionadas || [],
            pares_relacionados: r.pares_relacionados || null,
            es_correcta,
            puntaje_obtenido,
            revisado_por_admin: false,
        };
    }).filter(Boolean) as any[];

    await prisma.respuestaEstudiante.createMany({ data: respuestasData });

    const nuevoEstado = tiene_abiertas ? 'ENTREGADO' : 'CALIFICADO';
    const calificacion_final = tiene_abiertas ? null : limitarCalificacion(calificacion_auto);

    const intentoActualizado = await prisma.intento.update({
        where: { id: intento_id },
        data: {
            estado: nuevoEstado,
            calificacion_auto,
            calificacion_final,
            entregado_en: new Date(),
        },
    });

    return intentoActualizado;
};

export const listarCalificacionesEstudianteService = async (estudiante_id: string) => {
    return prisma.intento.findMany({
        where: {
            estudiante_id,
            estado: { in: ['ENTREGADO', 'CALIFICADO'] },
        },
        include: {
            examen: {
                select: {
                    titulo: true,
                    descripcion: true,
                    categoria: { select: { nombre: true } },
                },
            },
        },
        orderBy: { entregado_en: 'desc' },
    });
};

export const listarPendientesRevisionService = async () => {
    return prisma.intento.findMany({
        where: {
            estado: 'ENTREGADO',
            respuestas: {
                some: { revisado_por_admin: false, pregunta: { tipo: 'ABIERTA' } },
            },
        },
        include: {
            estudiante: { select: { id: true, nombre: true, email: true } },
            examen: { select: { id: true, titulo: true } },
            respuestas: {
                where: { revisado_por_admin: false, pregunta: { tipo: 'ABIERTA' } },
                include: { pregunta: { select: { enunciado: true, puntaje: true } } },
            },
        },
        orderBy: { entregado_en: 'asc' },
    });
};

export const calificarRespuestaAbiertaService = async (respuesta_id: string, puntaje_obtenido: number) => {
    const respuesta = await prisma.respuestaEstudiante.findUnique({
        where: { id: respuesta_id },
        include: { pregunta: true },
    });
    if (!respuesta) throw new Error('Respuesta no encontrada');
    if (respuesta.pregunta.tipo !== 'ABIERTA') throw new Error('Esta respuesta no es de tipo abierta');
    if (puntaje_obtenido < 0) throw new Error('El puntaje no puede ser negativo');
    if (puntaje_obtenido > Number(respuesta.pregunta.puntaje)) throw new Error(`El puntaje máximo es ${respuesta.pregunta.puntaje}`);

    await prisma.respuestaEstudiante.update({
        where: { id: respuesta_id },
        data: { puntaje_obtenido, revisado_por_admin: true },
    });

    // Verificar si todas las abiertas del intento ya fueron revisadas
    const intento_id = respuesta.intento_id;
    const pendientes = await prisma.respuestaEstudiante.count({
        where: {
            intento_id,
            revisado_por_admin: false,
            pregunta: { tipo: 'ABIERTA' },
        },
    });

    if (pendientes === 0) {
        const intento = await prisma.intento.findUnique({ where: { id: intento_id } });

        const respuestasAbiertas = await prisma.respuestaEstudiante.findMany({
            where: { intento_id, pregunta: { tipo: 'ABIERTA' } },
        });
        const calificacion_manual = respuestasAbiertas.reduce(
            (sum, r) => sum + Number(r.puntaje_obtenido || 0),
            0
        );
        const calificacion_final = limitarCalificacion(
            Number(intento?.calificacion_auto || 0) + calificacion_manual
        );

        await prisma.intento.update({
            where: { id: intento_id },
            data: { estado: 'CALIFICADO', calificacion_manual, calificacion_final },
        });
    }

    return { message: 'Respuesta calificada correctamente', pendientes };
};

export const obtenerIntentoService = async (intento_id: string, estudiante_id: string) => {
    const intento = await prisma.intento.findUnique({
        where: { id: intento_id },
        include: { examen: true },
    });
    if (!intento) throw new Error('Intento no encontrado');
    if (intento.estudiante_id !== estudiante_id) throw new Error('No autorizado');
    if (intento.estado !== 'EN_PROGRESO') throw new Error('Este examen ya fue entregado');

    const preguntas = await prisma.pregunta.findMany({
        where: { examen_id: intento.examen_id },
        orderBy: { orden: 'asc' },
        include: {
            opciones: { select: { id: true, texto: true, orden: true }, orderBy: { orden: 'asc' } },
            pares: { select: { id: true, lado_izquierdo: true, lado_derecho: true }, orderBy: { orden: 'asc' } },
            espacios: { select: { id: true, numero_espacio: true }, orderBy: { numero_espacio: 'asc' } },
        },
    });

    return { intento, examen: intento.examen, preguntas };
};