import prisma from '../../config/prisma';

export const listarExamenesService = async () => {
    return prisma.examen.findMany({
        orderBy: { creado_en: 'desc' },
        include: {
            categoria: { select: { id: true, nombre: true } },
            _count: { select: { intentos: true } },
        },
    });
};

export const crearExamenService = async (
    titulo: string,
    descripcion: string | undefined,
    categoria_id: string,
    tiempo_limite_min: number | undefined
) => {
    const categoria = await prisma.categoria.findUnique({ where: { id: categoria_id } });
    if (!categoria) throw new Error('Categoría no encontrada');

    return prisma.examen.create({
        data: { titulo, descripcion, categoria_id, tiempo_limite_min },
        include: { categoria: { select: { id: true, nombre: true } } },
    });
};

export const editarExamenService = async (
    id: string,
    titulo: string,
    descripcion: string | undefined,
    categoria_id: string,
    tiempo_limite_min: number | undefined
) => {
    const examen = await prisma.examen.findUnique({
        where: { id },
        include: { _count: { select: { intentos: true } } },
    });
    if (!examen) throw new Error('Examen no encontrado');
    if (examen._count.intentos > 0) throw new Error('No se puede editar un examen que ya tiene intentos');

    return prisma.examen.update({
        where: { id },
        data: { titulo, descripcion, categoria_id, tiempo_limite_min },
        include: { categoria: { select: { id: true, nombre: true } } },
    });
};

export const eliminarExamenService = async (id: string) => {
    const examen = await prisma.examen.findUnique({
        where: { id },
        include: {
            _count: { select: { intentos: true } },
            preguntas: { select: { id: true } },
        },
    });
    if (!examen) throw new Error('Examen no encontrado');
    if (examen._count.intentos > 0) throw new Error('No se puede eliminar un examen que ya tiene intentos');

    const preguntaIds = examen.preguntas.map(p => p.id);

    // Eliminar datos relacionados a las preguntas
    await prisma.opcionRespuesta.deleteMany({ where: { pregunta_id: { in: preguntaIds } } });
    await prisma.parRelacion.deleteMany({ where: { pregunta_id: { in: preguntaIds } } });
    await prisma.espacioBlanco.deleteMany({ where: { pregunta_id: { in: preguntaIds } } });

    // Eliminar preguntas
    await prisma.pregunta.deleteMany({ where: { examen_id: id } });

    // Eliminar examen
    return prisma.examen.delete({ where: { id } });
};

export const togglePublicadoService = async (id: string) => {
    const examen = await prisma.examen.findUnique({ where: { id } });
    if (!examen) throw new Error('Examen no encontrado');

    return prisma.examen.update({
        where: { id },
        data: { publicado: !examen.publicado },
        select: { id: true, titulo: true, publicado: true },
    });
};