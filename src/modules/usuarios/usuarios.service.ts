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