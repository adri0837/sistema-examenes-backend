import prisma from '../../config/prisma';
import { obtenerAsignacionesEstudianteService, obtenerAsignacionEstudianteExamenService } from '../grupos/grupos.service';

// ── Helper: normalizar puntaje a escala 100 ─────────────────────────
const normalizarA100 = (puntosObtenidos: number, puntosMaximos: number): number => {
    if (puntosMaximos === 0) return 0;
    return Math.round((puntosObtenidos / puntosMaximos) * 100 * 100) / 100;
};

const estaEnVentana = (fecha_inicio: Date | null, fecha_fin: Date | null, ahora: Date): boolean =>
    (!fecha_inicio || fecha_inicio <= ahora) && (!fecha_fin || fecha_fin >= ahora);

export const listarExamenesDisponiblesService = async (estudiante_id: string) => {
    const ahora = new Date();

    const asignaciones = await obtenerAsignacionesEstudianteService(estudiante_id);
    const asignacionesPorExamen = new Map<string, { fecha_inicio: Date | null; fecha_fin: Date | null }>();
    for (const asignacion of asignaciones) {
        if (!asignacionesPorExamen.has(asignacion.examen_id)) {
            asignacionesPorExamen.set(asignacion.examen_id, {
                fecha_inicio: asignacion.fecha_inicio,
                fecha_fin: asignacion.fecha_fin,
            });
        }
    }

    const examenes = await prisma.examen.findMany({
        where: { publicado: true },
        include: {
            categoria: { select: { id: true, nombre: true } },
            _count: { select: { preguntas: true } },
        },
        orderBy: { creado_en: 'desc' },
    });

    const examenesAsignados = examenes.filter(examen => {
        const asignacion = asignacionesPorExamen.get(examen.id);
        return !!asignacion && estaEnVentana(asignacion.fecha_inicio, asignacion.fecha_fin, ahora);
    });

    // Traer el intento más reciente por examen (puede haber más de uno si el admin dio otra oportunidad)
    const intentos = await prisma.intento.findMany({
        where: { estudiante_id },
        select: { id: true, examen_id: true, estado: true, calificacion_final: true },
        orderBy: { iniciado_en: 'desc' },
    });

    // Quedarnos solo con el más reciente por examen
    const intentosMap = new Map<string, typeof intentos[0]>();
    for (const intento of intentos) {
        if (!intentosMap.has(intento.examen_id)) {
            intentosMap.set(intento.examen_id, intento);
        }
    }

    return examenesAsignados.map(examen => {
        const asignacion = asignacionesPorExamen.get(examen.id)!;
        return {
            ...examen,
            asignacion: {
                fecha_inicio: asignacion.fecha_inicio,
                fecha_fin: asignacion.fecha_fin,
            },
            intento: intentosMap.get(examen.id) || null,
        };
    });
};

export const iniciarExamenService = async (estudiante_id: string, examen_id: string) => {
    const examen = await prisma.examen.findUnique({ where: { id: examen_id } });
    if (!examen) throw new Error('Examen no encontrado');
    if (!examen.publicado) throw new Error('El examen no está disponible');

    const asignacion = await obtenerAsignacionEstudianteExamenService(estudiante_id, examen_id);
    if (!asignacion) throw new Error('Este examen no te fue asignado');

    const ahora = new Date();
    if (asignacion.fecha_inicio && ahora < asignacion.fecha_inicio) {
        throw new Error('El examen aún no está disponible para rendir');
    }
    if (asignacion.fecha_fin && ahora > asignacion.fecha_fin) {
        throw new Error('El plazo para rendir este examen ya venció');
    }

    // Verificar si ya hay un intento activo o completado
    const intentoActivo = await prisma.intento.findFirst({
        where: {
            estudiante_id,
            examen_id,
            estado: { in: ['EN_PROGRESO', 'ENTREGADO', 'CALIFICADO', 'CANCELADO'] },
        },
        orderBy: { iniciado_en: 'desc' },
    });

    if (intentoActivo?.estado === 'EN_PROGRESO') throw new Error('Ya tienes un intento en progreso para este examen');
    if (intentoActivo) throw new Error('Ya realizaste este examen. Si fue cancelado, solicita una nueva oportunidad al administrador.');

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
        include: { opciones: true, pares: true, espacios: true },
    });

    // Calcular puntaje total posible del examen
    const puntosMaximos = preguntas.reduce((sum, p) => sum + Number(p.puntaje), 0);

    let puntosObtenidosAuto = 0;
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
                puntosObtenidosAuto += puntaje_obtenido;
            }
        } else if (pregunta.tipo === 'RELACIONAR') {
            const correctos = pregunta.pares.map(p => `${p.lado_izquierdo}|${p.lado_derecho}`).sort();
            const dados = (r.pares_relacionados || []).map((p: any) => `${p.izquierdo}|${p.derecho}`).sort();
            es_correcta = JSON.stringify(correctos) === JSON.stringify(dados);
            if (es_correcta) {
                puntaje_obtenido = Number(pregunta.puntaje);
                puntosObtenidosAuto += puntaje_obtenido;
            }
        } else if (pregunta.tipo === 'COMPLETAR') {
            const correctos = pregunta.espacios.map(e => e.respuesta_correcta.toLowerCase().trim());
            const dados = (r.espacios_respuestas || []).map((e: string) => (e || '').toLowerCase().trim());
            es_correcta = JSON.stringify(correctos) === JSON.stringify(dados);
            if (es_correcta) {
                puntaje_obtenido = Number(pregunta.puntaje);
                puntosObtenidosAuto += puntaje_obtenido;
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

    // Normalizar a 100 solo si no hay abiertas pendientes
    const calificacion_auto = normalizarA100(puntosObtenidosAuto, puntosMaximos);
    const calificacion_final = tiene_abiertas ? null : calificacion_auto;

    return prisma.intento.update({
        where: { id: intento_id },
        data: {
            estado: nuevoEstado,
            calificacion_auto,
            calificacion_final,
            entregado_en: new Date(),
        },
    });
};

export const listarCalificacionesEstudianteService = async (estudiante_id: string) => {
    return prisma.intento.findMany({
        where: {
            estudiante_id,
            estado: { in: ['EN_PROGRESO', 'ENTREGADO', 'CALIFICADO'] },
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
    if (puntaje_obtenido > Number(respuesta.pregunta.puntaje)) throw new Error(`El puntaje máximo es ${respuesta.pregunta.puntaje}`);

    await prisma.respuestaEstudiante.update({
        where: { id: respuesta_id },
        data: { puntaje_obtenido, revisado_por_admin: true },
    });

    const intento_id = respuesta.intento_id;
    const pendientes = await prisma.respuestaEstudiante.count({
        where: {
            intento_id,
            revisado_por_admin: false,
            pregunta: { tipo: 'ABIERTA' },
        },
    });

    if (pendientes === 0) {
        const todasLasRespuestas = await prisma.respuestaEstudiante.findMany({
            where: { intento_id },
            include: { pregunta: { select: { puntaje: true } } },
        });

        const puntosMaximos = todasLasRespuestas.reduce((sum, r) => sum + Number(r.pregunta.puntaje), 0);
        const puntosObtenidos = todasLasRespuestas.reduce((sum, r) => sum + Number(r.puntaje_obtenido || 0), 0);

        const calificacion_manual = todasLasRespuestas
            .filter(r => r.revisado_por_admin)
            .reduce((sum, r) => sum + Number(r.puntaje_obtenido || 0), 0);

        const intento = await prisma.intento.findUnique({ where: { id: intento_id } });
        const calificacion_final = normalizarA100(puntosObtenidos, puntosMaximos);

        await prisma.intento.update({
            where: { id: intento_id },
            data: {
                estado: 'CALIFICADO',
                calificacion_manual,
                calificacion_final,
            },
        });
    }

    return { message: 'Respuesta calificada correctamente', pendientes };
};

export const obtenerIntentoService = async (intento_id: string, estudiante_id: string) => {
    const intento = await prisma.intento.findUnique({
        where: { id: intento_id },
        include: { examen: true },
    });
    if (!intento) throw new Error('No existe un intento para este estudiante en este examen');
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

// ── Segunda oportunidad ─────────────────────────────────────────────
export const darSegundaOportunidadService = async (estudiante_id: string, examen_id: string) => {
    // Buscar el intento más reciente
    const intento = await prisma.intento.findFirst({
        where: {
            estudiante_id,
            examen_id,
            estado: { in: ['EN_PROGRESO', 'ENTREGADO', 'CALIFICADO', 'CANCELADO'] },
        },
        orderBy: { iniciado_en: 'desc' },
    });

    if (!intento) throw new Error('No existe un intento para este estudiante en este examen');

    // Eliminar incidentes de supervisión del intento anterior
    await prisma.incidenteSupervision.deleteMany({ where: { intento_id: intento.id } });

    // Eliminar respuestas del intento anterior
    await prisma.respuestaEstudiante.deleteMany({ where: { intento_id: intento.id } });

    // Eliminar el intento anterior para permitir uno nuevo
    await prisma.intento.delete({ where: { id: intento.id } });

    return { message: 'Segunda oportunidad otorgada correctamente' };
};