import prisma from '../../config/prisma';
import { TipoPregunta } from '@prisma/client';

const verificarExamenEditable = async (examen_id: string) => {
    const examen = await prisma.examen.findUnique({
        where: { id: examen_id },
        include: { _count: { select: { intentos: true } } },
    });
    if (!examen) throw new Error('Examen no encontrado');
    if (examen._count.intentos > 0) throw new Error('No se pueden modificar preguntas de un examen con intentos');
    return examen;
};

export const listarPreguntasService = async (examen_id: string) => {
    return prisma.pregunta.findMany({
        where: { examen_id },
        orderBy: { orden: 'asc' },
        include: {
            opciones: { orderBy: { orden: 'asc' } },
            pares: { orderBy: { orden: 'asc' } },
            espacios: { orderBy: { numero_espacio: 'asc' } },
        },
    });
};

export const crearPreguntaService = async (
    examen_id: string,
    enunciado: string,
    tipo: TipoPregunta,
    puntaje: number,
    opciones?: { texto: string; es_correcta: boolean }[],
    pares?: { lado_izquierdo: string; lado_derecho: string }[],
    espacios?: { respuesta_correcta: string }[]
) => {
    await verificarExamenEditable(examen_id);

    const totalPreguntas = await prisma.pregunta.count({ where: { examen_id } });

    return prisma.pregunta.create({
        data: {
            examen_id,
            enunciado,
            tipo,
            puntaje,
            orden: totalPreguntas + 1,
            opciones: (tipo === 'OPCION_MULTIPLE' || tipo === 'VERDADERO_FALSO') && opciones
                ? { create: opciones.map((o, i) => ({ texto: o.texto, es_correcta: o.es_correcta, orden: i + 1 })) }
                : undefined,
            pares: tipo === 'RELACIONAR' && pares
                ? { create: pares.map((p, i) => ({ lado_izquierdo: p.lado_izquierdo, lado_derecho: p.lado_derecho, orden: i + 1 })) }
                : undefined,
            espacios: tipo === 'COMPLETAR' && espacios
                ? { create: espacios.map((e, i) => ({ respuesta_correcta: e.respuesta_correcta, numero_espacio: i + 1 })) }
                : undefined,
        },
        include: {
            opciones: true,
            pares: true,
            espacios: true,
        },
    });
};

export const editarPreguntaService = async (
    id: string,
    enunciado: string,
    puntaje: number,
    opciones?: { texto: string; es_correcta: boolean }[],
    pares?: { lado_izquierdo: string; lado_derecho: string }[],
    espacios?: { respuesta_correcta: string }[]
) => {
    const pregunta = await prisma.pregunta.findUnique({ where: { id } });
    if (!pregunta) throw new Error('Pregunta no encontrada');
    await verificarExamenEditable(pregunta.examen_id);

    // Actualizar pregunta y reemplazar datos relacionados
    return prisma.pregunta.update({
        where: { id },
        data: {
            enunciado,
            puntaje,
            opciones: opciones ? {
                deleteMany: {},
                create: opciones.map((o, i) => ({ texto: o.texto, es_correcta: o.es_correcta, orden: i + 1 })),
            } : undefined,
            pares: pares ? {
                deleteMany: {},
                create: pares.map((p, i) => ({ lado_izquierdo: p.lado_izquierdo, lado_derecho: p.lado_derecho, orden: i + 1 })),
            } : undefined,
            espacios: espacios ? {
                deleteMany: {},
                create: espacios.map((e, i) => ({ respuesta_correcta: e.respuesta_correcta, numero_espacio: i + 1 })),
            } : undefined,
        },
        include: { opciones: true, pares: true, espacios: true },
    });
};

export const eliminarPreguntaService = async (id: string) => {
    const pregunta = await prisma.pregunta.findUnique({ where: { id } });
    if (!pregunta) throw new Error('Pregunta no encontrada');
    await verificarExamenEditable(pregunta.examen_id);

    return prisma.pregunta.delete({ where: { id } });
};