import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
    reportarIncidenteService,
    cancelarExamenService,
    listarIncidentesService,
    subirEvidenciaService,
    listarEvidenciasService,
    obtenerEvidenciaService,
    listarIntentosSupervisionService,
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

export const subirEvidencia = async (req: AuthRequest, res: Response) => {
    try {
        const estudiante_id = req.usuario!.id;
        const { intento_id } = req.params as { intento_id: string };
        const { tipo, incidente_id } = req.body as { tipo?: string; incidente_id?: string };

        if (!req.file) {
            res.status(400).json({ message: 'Debes adjuntar un archivo' });
            return;
        }
        if (tipo !== 'CAPTURA' && tipo !== 'GRABACION') {
            res.status(400).json({ message: 'El tipo de evidencia debe ser CAPTURA o GRABACION' });
            return;
        }

        const evidencia = await subirEvidenciaService(
            intento_id,
            estudiante_id,
            tipo,
            req.file.filename,
            req.file.mimetype || null,
            req.file.size,
            incidente_id
        );
        res.status(201).json({ ...evidencia, url: `/uploads/evidencias/${evidencia.archivo}` });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const listarEvidencias = async (req: AuthRequest, res: Response) => {
    try {
        const { intento_id } = req.params as { intento_id: string };
        const evidencias = await listarEvidenciasService(intento_id);
        res.status(200).json(
            evidencias.map(e => ({ ...e, url: `/uploads/evidencias/${e.archivo}` }))
        );
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const listarIntentosSupervision = async (req: AuthRequest, res: Response) => {
    try {
        const intentos = await listarIntentosSupervisionService();
        res.status(200).json(intentos);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const descargarEvidencia = async (req: AuthRequest, res: Response) => {
    try {
        const { evidencia_id } = req.params as { evidencia_id: string };
        const evidencia = await obtenerEvidenciaService(evidencia_id);
        const ruta = path.resolve(process.cwd(), 'uploads', 'evidencias', evidencia.archivo);
        if (!fs.existsSync(ruta)) {
            res.status(404).json({ message: 'El archivo no existe en el servidor' });
            return;
        }
        res.setHeader('Content-Type', evidencia.mime || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${evidencia.archivo}"`);
        res.sendFile(ruta);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
