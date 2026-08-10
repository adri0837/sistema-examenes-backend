import prisma from '../../config/prisma';

export const listarGruposService = async () => {
    return prisma.grupo.findMany({
        include: {
            _count: { select: { estudiantes: true, asignaciones: true } },
        },
        orderBy: { creado_en: 'desc' },
    });
};

export const crearGrupoService = async (nombre: string, descripcion: string | undefined) => {
    const existente = await prisma.grupo.findUnique({ where: { nombre } });
    if (existente) throw new Error('Ya existe un grupo con ese nombre');

    return prisma.grupo.create({
        data: { nombre, descripcion },
        include: {
            _count: { select: { estudiantes: true, asignaciones: true } },
        },
    });
};

export const detalleGrupoService = async (id: string) => {
    const grupo = await prisma.grupo.findUnique({
        where: { id },
        include: {
            estudiantes: {
                include: {
                    estudiante: {
                        select: { id: true, nombre: true, email: true, activo: true, creado_en: true },
                    },
                },
                orderBy: { agregado_en: 'desc' },
            },
            asignaciones: {
                include: {
                    examen: {
                        select: {
                            id: true,
                            titulo: true,
                            descripcion: true,
                            publicado: true,
                            categoria: { select: { id: true, nombre: true } },
                        },
                    },
                },
                orderBy: { asignado_en: 'desc' },
            },
        },
    });
    if (!grupo) throw new Error('Grupo no encontrado');

    return grupo;
};

export const editarGrupoService = async (id: string, nombre: string, descripcion: string | undefined) => {
    const grupo = await prisma.grupo.findUnique({ where: { id } });
    if (!grupo) throw new Error('Grupo no encontrado');

    if (nombre !== grupo.nombre) {
        const existente = await prisma.grupo.findUnique({ where: { nombre } });
        if (existente) throw new Error('Ya existe un grupo con ese nombre');
    }

    return prisma.grupo.update({
        where: { id },
        data: { nombre, descripcion },
        include: {
            _count: { select: { estudiantes: true, asignaciones: true } },
        },
    });
};

export const eliminarGrupoService = async (id: string) => {
    const grupo = await prisma.grupo.findUnique({ where: { id } });
    if (!grupo) throw new Error('Grupo no encontrado');

    return prisma.grupo.delete({ where: { id } });
};

export const agregarEstudiantesService = async (grupo_id: string, estudiante_ids: string[]) => {
    const grupo = await prisma.grupo.findUnique({ where: { id: grupo_id } });
    if (!grupo) throw new Error('Grupo no encontrado');
    if (!estudiante_ids || estudiante_ids.length === 0) throw new Error('Debes indicar al menos un estudiante');

    const estudiantes = await prisma.usuario.findMany({
        where: { id: { in: estudiante_ids } },
        select: { id: true, rol: true, activo: true },
    });

    const encontrados = new Map(estudiantes.map(e => [e.id, e]));
    for (const id of estudiante_ids) {
        const estudiante = encontrados.get(id);
        if (!estudiante) throw new Error('Uno de los estudiantes no existe');
        if (estudiante.rol !== 'ESTUDIANTE') throw new Error('Solo se pueden agregar usuarios con rol Estudiante');
        if (!estudiante.activo) throw new Error('Uno de los estudiantes está desactivado');
    }

    const resultado = await prisma.grupoUsuario.createMany({
        data: estudiante_ids.map(estudiante_id => ({ grupo_id, estudiante_id })),
        skipDuplicates: true,
    });

    return {
        message: 'Estudiantes agregados correctamente',
        agregados: resultado.count,
    };
};

export const quitarEstudianteService = async (grupo_id: string, estudiante_id: string) => {
    const resultado = await prisma.grupoUsuario.deleteMany({
        where: { grupo_id, estudiante_id },
    });
    if (resultado.count === 0) throw new Error('El estudiante no pertenece a este grupo');

    return { message: 'Estudiante removido del grupo correctamente' };
};

export const asignarExamenService = async (
    grupo_id: string,
    examen_id: string,
    fecha_inicio: Date | null,
    fecha_fin: Date | null
) => {
    const grupo = await prisma.grupo.findUnique({ where: { id: grupo_id } });
    if (!grupo) throw new Error('Grupo no encontrado');

    const examen = await prisma.examen.findUnique({ where: { id: examen_id } });
    if (!examen) throw new Error('Examen no encontrado');

    if (fecha_inicio && fecha_fin && fecha_inicio >= fecha_fin) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    const existente = await prisma.asignacionExamen.findUnique({
        where: { grupo_id_examen_id: { grupo_id, examen_id } },
    });
    if (existente) throw new Error('Este examen ya está asignado a este grupo');

    return prisma.asignacionExamen.create({
        data: {
            grupo_id,
            examen_id,
            fecha_inicio: fecha_inicio || null,
            fecha_fin: fecha_fin || null,
        },
        include: {
            grupo: { select: { id: true, nombre: true } },
            examen: { select: { id: true, titulo: true, publicado: true } },
        },
    });
};

export const desasignarExamenService = async (grupo_id: string, examen_id: string) => {
    const resultado = await prisma.asignacionExamen.deleteMany({
        where: { grupo_id, examen_id },
    });
    if (resultado.count === 0) throw new Error('Este examen no está asignado a este grupo');

    return { message: 'Examen desasignado correctamente' };
};

export const editarAsignacionService = async (
    grupo_id: string,
    examen_id: string,
    fecha_inicio: Date | null | undefined,
    fecha_fin: Date | null | undefined
) => {
    const asignacion = await prisma.asignacionExamen.findUnique({
        where: { grupo_id_examen_id: { grupo_id, examen_id } },
    });
    if (!asignacion) throw new Error('Este examen no está asignado a este grupo');

    if (fecha_inicio && fecha_fin && fecha_inicio >= fecha_fin) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    return prisma.asignacionExamen.update({
        where: { grupo_id_examen_id: { grupo_id, examen_id } },
        data: {
            fecha_inicio: fecha_inicio === undefined ? asignacion.fecha_inicio : fecha_inicio,
            fecha_fin: fecha_fin === undefined ? asignacion.fecha_fin : fecha_fin,
        },
        include: {
            grupo: { select: { id: true, nombre: true } },
            examen: { select: { id: true, titulo: true, publicado: true } },
        },
    });
};

export const listarEstudiantesFueraDeGrupoService = async (grupo_id: string) => {
    const grupo = await prisma.grupo.findUnique({ where: { id: grupo_id } });
    if (!grupo) throw new Error('Grupo no encontrado');

    const miembros = await prisma.grupoUsuario.findMany({
        where: { grupo_id },
        select: { estudiante_id: true },
    });
    const miembroIds = miembros.map(m => m.estudiante_id);

    return prisma.usuario.findMany({
        where: {
            rol: 'ESTUDIANTE',
            activo: true,
            ...(miembroIds.length > 0 ? { id: { notIn: miembroIds } } : {}),
        },
        select: { id: true, nombre: true, email: true },
        orderBy: { nombre: 'asc' },
    });
};

// ── Helpers usados por el flujo del estudiante ─────────────────────

export const obtenerAsignacionesEstudianteService = async (estudiante_id: string) => {
    const membresias = await prisma.grupoUsuario.findMany({
        where: { estudiante_id },
        select: { grupo_id: true },
    });
    if (membresias.length === 0) return [];

    const grupoIds = membresias.map(m => m.grupo_id);
    return prisma.asignacionExamen.findMany({
        where: { grupo_id: { in: grupoIds } },
        select: {
            examen_id: true,
            fecha_inicio: true,
            fecha_fin: true,
        },
    });
};

export const obtenerAsignacionEstudianteExamenService = async (estudiante_id: string, examen_id: string) => {
    const asignaciones = await obtenerAsignacionesEstudianteService(estudiante_id);
    return asignaciones.find(a => a.examen_id === examen_id) || null;
};
