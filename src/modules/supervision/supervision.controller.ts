import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
    reportarIncidenteService,
    cancelarExamenService,
    listarIncidentesService,
} from './supervision.service';

export const reportarIncidente = async (req: AuthRequest, res: Response) => {
    try {
        const estudiante_id = req.usuario!.id;
        const { intento_id } = req.params as { intento_id: string };
        const { tipo, descripcion } = req.body;

        if (!tipo) {
            res.status(400).json({ message: 'El tipo de incidente es requerido' });
            return;
        }

        const resultado = await reportarIncidenteService(intento_id, estudiante_id, tipo, descripcion);
        res.status(201).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const cancelarExamen = async (req: AuthRequest, res: Response) => {
    try {
        const estudiante_id = req.usuario!.id;
        const { intento_id } = req.params as { intento_id: string };
        const resultado = await cancelarExamenService(intento_id, estudiante_id);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const listarIncidentes = async (req: AuthRequest, res: Response) => {
    try {
        const { intento_id } = req.params as { intento_id: string };
        const incidentes = await listarIncidentesService(intento_id);
        res.status(200).json(incidentes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
