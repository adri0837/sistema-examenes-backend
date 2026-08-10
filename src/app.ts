import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import authRoutes from './modules/auth/auth.routes';
import usuariosRoutes from './modules/usuarios/usuarios.routes';
import categoriasRoutes from './modules/categorias/categorias.routes';
import examenesRoutes from './modules/examenes/examenes.routes';
import preguntasRoutes from './modules/preguntas/preguntas.routes';
import intentosRoutes from './modules/intentos/intentos.routes';
import supervisionRoutes from './modules/supervision/supervision.routes';
import reportesRoutes from './modules/reportes/reportes.routes';
import gruposRoutes from './modules/grupos/grupos.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/examenes', examenesRoutes);
app.use('/api', preguntasRoutes);
app.use('/api', intentosRoutes);
app.use('/api', supervisionRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/grupos', gruposRoutes);

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof multer.MulterError || error?.message?.includes('no permitido')) {
        res.status(400).json({ message: error.message });
        return;
    }
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;