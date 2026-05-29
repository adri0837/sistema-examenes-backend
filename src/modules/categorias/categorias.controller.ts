import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { listarCategoriasService, crearCategoriaService, editarCategoriaService, eliminarCategoriaService } from './categorias.service';

export const listarCategorias = async (req: AuthRequest, res: Response) => {
    try {
        const categorias = await listarCategoriasService();
        res.status(200).json(categorias);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const crearCategoria = async (req: AuthRequest, res: Response) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre) {
            res.status(400).json({ message: 'El nombre es requerido' });
            return;
        }
        const categoria = await crearCategoriaService(nombre, descripcion);
        res.status(201).json(categoria);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const editarCategoria = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { nombre, descripcion } = req.body;
        if (!nombre) {
            res.status(400).json({ message: 'El nombre es requerido' });
            return;
        }
        const categoria = await editarCategoriaService(id, nombre, descripcion);
        res.status(200).json(categoria);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const eliminarCategoria = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        await eliminarCategoriaService(id);
        res.status(200).json({ message: 'Categoría eliminada correctamente' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};