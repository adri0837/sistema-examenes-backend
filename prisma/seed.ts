// Usuarios ADMIN ASIGNADOS POR DEFECTO
import { PrismaClient, Rol } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Aquí defines la contraseña a hashear
    const passwordHash = await bcrypt.hash('admin123', 10);

    await prisma.usuario.upsert({
        where: { email: 'admin@examenes.com' },
        update: {},
        create: {
            nombre: 'Administrador',
            email: 'admin@examenes.com',
            password_hash: passwordHash,
            rol: Rol.ADMIN,
        },
    });

    console.log('✅ Admin creado correctamente');

    const passwordHashEstudiante = await bcrypt.hash('estudiante123', 10);

    await prisma.usuario.upsert({
        where: { email: 'estudiante@examenes.com' },
        update: {},
        create: {
            nombre: 'Estudiante Prueba',
            email: 'estudiante@examenes.com',
            password_hash: passwordHashEstudiante,
            rol: Rol.ESTUDIANTE,
        },
    });

    console.log('✅ Estudiante creado correctamente');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());