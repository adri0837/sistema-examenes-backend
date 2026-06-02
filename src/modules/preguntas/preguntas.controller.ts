import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { listarPreguntasService, crearPreguntaService, editarPreguntaService, eliminarPreguntaService } from './preguntas.service';
import { TipoPregunta } from '@prisma/client';

export const listarPreguntas = async (req: AuthRequest, res: Response) => {
    try {
        const { examen_id } = req.params as { examen_id: string };
        const preguntas = await listarPreguntasService(examen_id);
        res.status(200).json(preguntas);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const crearPregunta = async (req: AuthRequest, res: Response) => {
    try {
        const { examen_id } = req.params as { examen_id: string };
        const { enunciado, tipo, puntaje, tiempo_limite_seg, opciones, pares, espacios } = req.body;

        if (!enunciado || !tipo || puntaje === undefined) {
            res.status(400).json({ message: 'Enunciado, tipo y puntaje son requeridos' });
            return;
        }

        const tiposValidos: TipoPregunta[] = ['OPCION_MULTIPLE', 'VERDADERO_FALSO', 'ABIERTA', 'RELACIONAR', 'COMPLETAR'];
        if (!tiposValidos.includes(tipo)) {
            res.status(400).json({ message: 'Tipo de pregunta inválido' });
            return;
        }

        const pregunta = await crearPreguntaService(examen_id, enunciado, tipo, puntaje, tiempo_limite_seg, opciones, pares, espacios);
        res.status(201).json(pregunta);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const editarPregunta = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { enunciado, puntaje, tiempo_limite_seg, opciones, pares, espacios } = req.body;

        if (!enunciado || puntaje === undefined) {
            res.status(400).json({ message: 'Enunciado y puntaje son requeridos' });
            return;
        }

        const pregunta = await editarPreguntaService(id, enunciado, puntaje, tiempo_limite_seg, opciones, pares, espacios);
        res.status(200).json(pregunta);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const eliminarPregunta = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        await eliminarPreguntaService(id);
        res.status(200).json({ message: 'Pregunta eliminada correctamente' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};