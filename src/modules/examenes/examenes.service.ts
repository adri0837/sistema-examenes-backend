import prisma from '../../config/prisma';

export const listarExamenesService = async () => {
    return prisma.examen.findMany({
        orderBy: { creado_en: 'desc' },
        include: {
            categoria: { select: { id: true, nombre: true } },
            _count: { select: { intentos: true, asignaciones: true } },
            asignaciones: {
                include: { grupo: { select: { id: true, nombre: true } } },
            },
        },
    });
};

export const crearExamenService = async (
    titulo: string,
    descripcion: string | undefined,
    categoria_id: string,
    supervision_activa?: boolean
) => {
    const categoria = await prisma.categoria.findUnique({ where: { id: categoria_id } });
    if (!categoria) throw new Error('Categoría no encontrada');

    return prisma.examen.create({
        data: { titulo, descripcion, categoria_id, supervision_activa: supervision_activa ?? false },
        include: { categoria: { select: { id: true, nombre: true } } },
    });
};

export const editarExamenService = async (
    id: string,
    titulo: string,
    descripcion: string | undefined,
    categoria_id: string,
    supervision_activa?: boolean
) => {
    const examen = await prisma.examen.findUnique({ where: { id } });
    if (!examen) throw new Error('Examen no encontrado');

    const updateData: any = { titulo, descripcion, categoria_id };
    if (supervision_activa !== undefined) updateData.supervision_activa = supervision_activa;

    return prisma.examen.update({
        where: { id },
        data: updateData,
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

    return prisma.$transaction(async (tx) => {
        // Si hay intentos, limpiarlos primero
        if (examen._count.intentos > 0) {
            const intentos = await tx.intento.findMany({ where: { examen_id: id }, select: { id: true } });
            const ids = intentos.map(i => i.id);
            await tx.incidenteSupervision.deleteMany({ where: { intento_id: { in: ids } } });
            await tx.respuestaEstudiante.deleteMany({ where: { intento_id: { in: ids } } });
            await tx.intento.deleteMany({ where: { examen_id: id } });
        }

        const preguntaIds = examen.preguntas.map(p => p.id);

        // Eliminar datos relacionados a las preguntas
        await tx.opcionRespuesta.deleteMany({ where: { pregunta_id: { in: preguntaIds } } });
        await tx.parRelacion.deleteMany({ where: { pregunta_id: { in: preguntaIds } } });
        await tx.espacioBlanco.deleteMany({ where: { pregunta_id: { in: preguntaIds } } });

        // Eliminar preguntas
        await tx.pregunta.deleteMany({ where: { examen_id: id } });

        // Eliminar examen
        return tx.examen.delete({ where: { id } });
    });
};

export const resetearIntentosExamenService = async (id: string) => {
    const examen = await prisma.examen.findUnique({
        where: { id },
        include: { _count: { select: { intentos: true } } },
    });
    if (!examen) throw new Error('Examen no encontrado');
    if (examen._count.intentos === 0) throw new Error('El examen no tiene intentos');

    return prisma.$transaction(async (tx) => {
        const intentos = await tx.intento.findMany({ where: { examen_id: id }, select: { id: true } });
        const ids = intentos.map(i => i.id);
        await tx.incidenteSupervision.deleteMany({ where: { intento_id: { in: ids } } });
        await tx.respuestaEstudiante.deleteMany({ where: { intento_id: { in: ids } } });
        await tx.intento.deleteMany({ where: { examen_id: id } });
        return { message: `Se eliminaron ${intentos.length} intento(s)` };
    });
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