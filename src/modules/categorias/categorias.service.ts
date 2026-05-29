import prisma from '../../config/prisma';

export const listarCategoriasService = async () => {
    return prisma.categoria.findMany({
        orderBy: { nombre: 'asc' },
        include: { _count: { select: { examenes: true } } },
    });
};

export const crearCategoriaService = async (nombre: string, descripcion?: string) => {
    const existente = await prisma.categoria.findUnique({ where: { nombre } });
    if (existente) throw new Error('Ya existe una categoría con ese nombre');

    return prisma.categoria.create({
        data: { nombre, descripcion },
    });
};

export const editarCategoriaService = async (id: string, nombre: string, descripcion?: string) => {
    const categoria = await prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new Error('Categoría no encontrada');

    return prisma.categoria.update({
        where: { id },
        data: { nombre, descripcion },
    });
};

export const eliminarCategoriaService = async (id: string) => {
    const categoria = await prisma.categoria.findUnique({
        where: { id },
        include: { _count: { select: { examenes: true } } },
    });
    if (!categoria) throw new Error('Categoría no encontrada');
    if (categoria._count.examenes > 0) throw new Error('No se puede eliminar una categoría con exámenes asociados');

    return prisma.categoria.delete({ where: { id } });
};