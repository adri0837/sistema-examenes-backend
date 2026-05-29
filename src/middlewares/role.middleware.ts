import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const soloAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.usuario?.rol !== 'ADMIN') {
        res.status(403).json({ message: 'Acceso denegado — se requiere rol Admin' });
        return;
    }
    next();
};

export const soloEstudiante = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.usuario?.rol !== 'ESTUDIANTE') {
        res.status(403).json({ message: 'Acceso denegado — se requiere rol Estudiante' });
        return;
    }
    next();
};