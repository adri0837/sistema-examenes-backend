import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import usuariosRoutes from './modules/usuarios/usuarios.routes';
import categoriasRoutes from './modules/categorias/categorias.routes';
import examenesRoutes from './modules/examenes/examenes.routes';
import preguntasRoutes from './modules/preguntas/preguntas.routes';
import intentosRoutes from './modules/intentos/intentos.routes';
import reportesRoutes from './modules/reportes/reportes.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/examenes', examenesRoutes);
app.use('/api', preguntasRoutes);
app.use('/api', intentosRoutes);
app.use('/api/reportes', reportesRoutes);

export default app;