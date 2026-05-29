import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
    listarExamenesService,
    crearExamenService,
    editarExamenService,
    eliminarExamenService,
    togglePublicadoService,
} from './examenes.service';

export const listarExamenes = async (req: AuthRequest, res: Response) => {
    try {
        const examenes = await listarExamenesService();
        res.status(200).json(examenes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const crearExamen = async (req: AuthRequest, res: Response) => {
    try {
        const { titulo, descripcion, categoria_id, tiempo_limite_min } = req.body;
        if (!titulo || !categoria_id) {
            res.status(400).json({ message: 'Título y categoría son requeridos' });
            return;
        }
        const examen = await crearExamenService(titulo, descripcion, categoria_id, tiempo_limite_min);
        res.status(201).json(examen);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const editarExamen = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { titulo, descripcion, categoria_id, tiempo_limite_min } = req.body;
        if (!titulo || !categoria_id) {
            res.status(400).json({ message: 'Título y categoría son requeridos' });
            return;
        }
        const examen = await editarExamenService(id, titulo, descripcion, categoria_id, tiempo_limite_min);
        res.status(200).json(examen);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const eliminarExamen = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        await eliminarExamenService(id);
        res.status(200).json({ message: 'Examen eliminado correctamente' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const togglePublicado = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const examen = await togglePublicadoService(id);
        res.status(200).json(examen);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};