import { Request, Response } from 'express';
import { loginService, registroService } from './auth.service';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email y contraseña son requeridos' });
            return;
        }
        const resultado = await loginService(email, password);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};

export const registro = async (req: Request, res: Response) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
            return;
        }
        const resultado = await registroService(nombre, email, password);
        res.status(201).json(resultado);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};