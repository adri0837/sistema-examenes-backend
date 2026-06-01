import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
    listarExamenesDisponiblesService,
    iniciarExamenService,
    entregarExamenService,
    listarCalificacionesEstudianteService,
    listarPendientesRevisionService,
    calificarRespuestaAbiertaService,
} from './intentos.service';

export const listarExamenesDisponibles = async (req: AuthRequest, res: Response) => {
    try {
        const estudiante_id = req.usuario!.id;
        const examenes = await listarExamenesDisponiblesService(estudiante_id);
        res.status(200).json(examenes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const iniciarExamen = async (req: AuthRequest, res: Response) => {
    try {
        const estudiante_id = req.usuario!.id;
        const { examen_id } = req.params as { examen_id: string };
        const resultado = await iniciarExamenService(estudiante_id, examen_id);
        res.status(201).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const entregarExamen = async (req: AuthRequest, res: Response) => {
    try {
        const estudiante_id = req.usuario!.id;
        const { intento_id } = req.params as { intento_id: string };
        const { respuestas } = req.body;

        if (!respuestas || !Array.isArray(respuestas)) {
            res.status(400).json({ message: 'Las respuestas son requeridas' });
            return;
        }

        const resultado = await entregarExamenService(intento_id, estudiante_id, respuestas);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const listarCalificaciones = async (req: AuthRequest, res: Response) => {
    try {
        const estudiante_id = req.usuario!.id;
        const calificaciones = await listarCalificacionesEstudianteService(estudiante_id);
        res.status(200).json(calificaciones);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const listarPendientesRevision = async (req: AuthRequest, res: Response) => {
    try {
        const pendientes = await listarPendientesRevisionService();
        res.status(200).json(pendientes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const calificarRespuestaAbierta = async (req: AuthRequest, res: Response) => {
    try {
        const { respuesta_id } = req.params as { respuesta_id: string };
        const { puntaje_obtenido } = req.body;
        if (puntaje_obtenido === undefined) {
            res.status(400).json({ message: 'El puntaje es requerido' });
            return;
        }
        const resultado = await calificarRespuestaAbiertaService(respuesta_id, puntaje_obtenido);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

import { obtenerIntentoService } from './intentos.service';

export const obtenerIntento = async (req: AuthRequest, res: Response) => {
    try {
        const estudiante_id = req.usuario!.id;
        const { intento_id } = req.params as { intento_id: string };
        const resultado = await obtenerIntentoService(intento_id, estudiante_id);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

import { darSegundaOportunidadService } from './intentos.service';

export const darSegundaOportunidad = async (req: AuthRequest, res: Response) => {
    try {
        const { estudiante_id, examen_id } = req.params as { estudiante_id: string; examen_id: string };
        const resultado = await darSegundaOportunidadService(estudiante_id, examen_id);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};