import prisma from '../../config/prisma';

export const reportePorExamenService = async (examen_id: string) => {
    const examen = await prisma.examen.findUnique({
        where: { id: examen_id },
        select: { titulo: true, descripcion: true, categoria: { select: { nombre: true } } },
    });
    if (!examen) throw new Error('Examen no encontrado');

    const intentos = await prisma.intento.findMany({
        where: { examen_id, estado: { in: ['EN_PROGRESO', 'ENTREGADO', 'CALIFICADO'] } },
        include: {
            estudiante: { select: { id: true, nombre: true, email: true } },
        },
        orderBy: { entregado_en: 'desc' },
    });

    return { examen, intentos };
};

export const reportePorEstudianteService = async (estudiante_id: string) => {
    const estudiante = await prisma.usuario.findUnique({
        where: { id: estudiante_id },
        select: { nombre: true, email: true },
    });
    if (!estudiante) throw new Error('Estudiante no encontrado');

    const intentos = await prisma.intento.findMany({
        where: { estudiante_id, estado: { in: ['EN_PROGRESO', 'ENTREGADO', 'CALIFICADO'] } },
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
        orderBy: { entregado_en: 'desc' },
    });

    return { estudiante, intentos };
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