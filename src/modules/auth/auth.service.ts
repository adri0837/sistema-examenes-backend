import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma';

export const loginService = async (email: string, password: string) => {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) throw new Error('Credenciales inválidas');
    if (!usuario.activo) throw new Error('Usuario desactivado');

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) throw new Error('Credenciales inválidas');

    const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol },
        process.env.JWT_SECRET as string,
        { expiresIn: '8h' }
    );

    return {
        token,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
        },
    };
};

export const registroService = async (nombre: string, email: string, password: string) => {
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) throw new Error('El email ya está registrado');

    const password_hash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
        data: {
            nombre,
            email,
            password_hash,
            rol: 'ESTUDIANTE',
        },
    });

    return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
    };
};