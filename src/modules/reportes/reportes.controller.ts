import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
    reportePorExamenService,
    reportePorEstudianteService,
    listarExamenesParaReporteService,
    listarEstudiantesParaReporteService,
} from './reportes.service';

export const reportePorExamen = async (req: AuthRequest, res: Response) => {
    try {
        const { examen_id } = req.params as { examen_id: string };
        const reporte = await reportePorExamenService(examen_id);
        res.status(200).json(reporte);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const reportePorEstudiante = async (req: AuthRequest, res: Response) => {
    try {
        const { estudiante_id } = req.params as { estudiante_id: string };
        const reporte = await reportePorEstudianteService(estudiante_id);
        res.status(200).json(reporte);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const listarExamenesParaReporte = async (req: AuthRequest, res: Response) => {
    try {
        const examenes = await listarExamenesParaReporteService();
        res.status(200).json(examenes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const listarEstudiantesParaReporte = async (req: AuthRequest, res: Response) => {
    try {
        const estudiantes = await listarEstudiantesParaReporteService();
        res.status(200).json(estudiantes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};