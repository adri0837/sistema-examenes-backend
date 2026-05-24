import { Request, Response } from 'express';
import { loginService } from './auth.service';

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