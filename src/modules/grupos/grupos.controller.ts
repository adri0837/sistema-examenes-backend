import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
    listarGruposService,
    crearGrupoService,
    detalleGrupoService,
    editarGrupoService,
    eliminarGrupoService,
    agregarEstudiantesService,
    quitarEstudianteService,
    asignarExamenService,
    desasignarExamenService,
    editarAsignacionService,
    listarEstudiantesFueraDeGrupoService,
} from './grupos.service';

const parseFecha = (valor: any): Date | null | undefined => {
    if (valor === undefined) return undefined;
    if (valor === null || valor === '') return null;
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) throw new Error('Formato de fecha inválido');
    return fecha;
};

export const listarGrupos = async (req: AuthRequest, res: Response) => {
    try {
        const grupos = await listarGruposService();
        res.status(200).json(grupos);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const crearGrupo = async (req: AuthRequest, res: Response) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre) {
            res.status(400).json({ message: 'El nombre es requerido' });
            return;
        }
        const grupo = await crearGrupoService(nombre, descripcion);
        res.status(201).json(grupo);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const detalleGrupo = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const grupo = await detalleGrupoService(id);
        res.status(200).json(grupo);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const editarGrupo = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { nombre, descripcion } = req.body;
        if (!nombre) {
            res.status(400).json({ message: 'El nombre es requerido' });
            return;
        }
        const grupo = await editarGrupoService(id, nombre, descripcion);
        res.status(200).json(grupo);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const eliminarGrupo = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        await eliminarGrupoService(id);
        res.status(200).json({ message: 'Grupo eliminado correctamente' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const agregarEstudiantes = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { estudiante_ids } = req.body;
        if (!Array.isArray(estudiante_ids)) {
            res.status(400).json({ message: 'Debes enviar una lista estudiante_ids' });
            return;
        }
        const resultado = await agregarEstudiantesService(id, estudiante_ids);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const quitarEstudiante = async (req: AuthRequest, res: Response) => {
    try {
        const { id, estudiante_id } = req.params as { id: string; estudiante_id: string };
        const resultado = await quitarEstudianteService(id, estudiante_id);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const listarEstudiantesFueraDeGrupo = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const estudiantes = await listarEstudiantesFueraDeGrupoService(id);
        res.status(200).json(estudiantes);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const asignarExamen = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { examen_id, fecha_inicio, fecha_fin } = req.body;
        if (!examen_id) {
            res.status(400).json({ message: 'El examen_id es requerido' });
            return;
        }
        const inicio = parseFecha(fecha_inicio);
        const fin = parseFecha(fecha_fin);
        const asignacion = await asignarExamenService(id, examen_id, inicio ?? null, fin ?? null);
        res.status(201).json(asignacion);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const editarAsignacion = async (req: AuthRequest, res: Response) => {
    try {
        const { id, examen_id } = req.params as { id: string; examen_id: string };
        const { fecha_inicio, fecha_fin } = req.body;
        const inicio = parseFecha(fecha_inicio);
        const fin = parseFecha(fecha_fin);
        const asignacion = await editarAsignacionService(id, examen_id, inicio, fin);
        res.status(200).json(asignacion);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const desasignarExamen = async (req: AuthRequest, res: Response) => {
    try {
        const { id, examen_id } = req.params as { id: string; examen_id: string };
        const resultado = await desasignarExamenService(id, examen_id);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
