import prisma from '../../config/prisma';

// Dejar un solo intento por (estudiante, examen): el más reciente.
// Un reintento deja dos filas (el CANCELADO/REPROBADO original + el nuevo);
// en reportes solo interesa el último. El historial viejo queda intacto en la DB.
const deduplicarPorEstudianteExamen = <T extends { estudiante_id: string; examen_id: string }>(intentos: T[]): T[] => {
    const mapa = new Map<string, T>();
    for (const intento of intentos) {
        const clave = `${intento.estudiante_id}:${intento.examen_id}`;
        if (!mapa.has(clave)) mapa.set(clave, intento);
    }
    return [...mapa.values()];
};

export const reportePorExamenService = async (examen_id: string) => {
    const examen = await prisma.examen.findUnique({
        where: { id: examen_id },
        select: { titulo: true, descripcion: true, categoria: { select: { nombre: true } } },
    });
    if (!examen) throw new Error('Examen no encontrado');

    const intentos = await prisma.intento.findMany({
        where: { examen_id, estado: { in: ['EN_PROGRESO', 'ENTREGADO', 'CALIFICADO', 'CANCELADO'] } },
        include: {
            estudiante: { select: { id: true, nombre: true, email: true } },
        },
        orderBy: { iniciado_en: 'desc' },
    });

    return { examen, intentos: deduplicarPorEstudianteExamen(intentos) };
};

export const reportePorEstudianteService = async (estudiante_id: string) => {
    const estudiante = await prisma.usuario.findUnique({
        where: { id: estudiante_id },
        select: { nombre: true, email: true },
    });
    if (!estudiante) throw new Error('Estudiante no encontrado');

    const intentos = await prisma.intento.findMany({
        where: { estudiante_id, estado: { in: ['EN_PROGRESO', 'ENTREGADO', 'CALIFICADO', 'CANCELADO'] } },
        include: {
            examen: {
                select: {
                    id: true,
                    titulo: true,
                    descripcion: true,
                    categoria: { select: { nombre: true } },
                },
            },
        },
        orderBy: { iniciado_en: 'desc' },
    });

    return { estudiante, intentos: deduplicarPorEstudianteExamen(intentos) };
};

export const listarExamenesParaReporteService = async () => {
    return prisma.examen.findMany({
        select: { id: true, titulo: true, categoria: { select: { nombre: true } } },
        orderBy: { titulo: 'asc' },
    });
};

export const listarEstudiantesParaReporteService = async () => {
    return prisma.usuario.findMany({
        where: { rol: 'ESTUDIANTE', activo: true },
        select: { id: true, nombre: true, email: true },
        orderBy: { nombre: 'asc' },
    });
};