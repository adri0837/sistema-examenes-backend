import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { listarEstudiantesService, crearEstudianteService, toggleActivoService } from './usuarios.service';

export const listarEstudiantes = async (req: AuthRequest, res: Response) => {
    try {
        const estudiantes = await listarEstudiantesService();
        res.status(200).json(estudiantes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const crearEstudiante = async (req: AuthRequest, res: Response) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
            return;
        }
        const estudiante = await crearEstudianteService(nombre, email, password);
        res.status(201).json(estudiante);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const toggleActivo = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const usuario = await toggleActivoService(id);
        res.status(200).json(usuario);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};