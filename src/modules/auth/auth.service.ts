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