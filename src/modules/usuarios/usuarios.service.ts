import bcrypt from 'bcrypt';
import prisma from '../../config/prisma';

export const listarEstudiantesService = async () => {
    return prisma.usuario.findMany({
        where: { rol: 'ESTUDIANTE' },
        select: {
            id: true,
            nombre: true,
            email: true,
            activo: true,
            creado_en: true,
        },
        orderBy: { creado_en: 'desc' },
    });
};

export const crearEstudianteService = async (nombre: string, email: string, password: string) => {
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) throw new Error('El email ya está registrado');

    const password_hash = await bcrypt.hash(password, 10);

    return prisma.usuario.create({
        data: { nombre, email, password_hash, rol: 'ESTUDIANTE' },
        select: { id: true, nombre: true, email: true, activo: true, creado_en: true },
    });
};

export const toggleActivoService = async (id: string) => {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new Error('Usuario no encontrado');
    if (usuario.rol === 'ADMIN') throw new Error('No se puede modificar al administrador');

    return prisma.usuario.update({
        where: { id },
        data: { activo: !usuario.activo },
        select: { id: true, nombre: true, email: true, activo: true },
    });
};

export const eliminarEstudianteService = async (id: string) => {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new Error('Usuario no encontrado');
    if (usuario.rol === 'ADMIN') throw new Error('No se puede eliminar al administrador');
    if (usuario.activo) throw new Error('Solo se puede eliminar un usuario desactivado');

    return prisma.$transaction(async (tx) => {
        // Buscar todos los intentos del usuario
        const intentos = await tx.intento.findMany({
            where: { estudiante_id: id },
            select: { id: true },
        });
        const ids = intentos.map(i => i.id);

        if (ids.length > 0) {
            // Eliminar incidentes de supervisión
            await tx.incidenteSupervision.deleteMany({ where: { intento_id: { in: ids } } });
            // Eliminar respuestas de los intentos
            await tx.respuestaEstudiante.deleteMany({ where: { intento_id: { in: ids } } });
            // Eliminar los intentos
            await tx.intento.deleteMany({ where: { estudiante_id: id } });
        }

        // Finalmente eliminar el usuario
        return tx.usuario.delete({ where: { id } });
    });
};