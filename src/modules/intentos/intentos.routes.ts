import { Router } from 'express';
import {
    listarExamenesDisponibles,
    iniciarExamen,
    entregarExamen,
    listarCalificaciones,
    obtenerIntento,
    listarPendientesRevision,
    calificarRespuestaAbierta,
} from './intentos.controller';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloEstudiante, soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

// Rutas del estudiante
router.get('/estudiante/examenes-disponibles', verificarToken, soloEstudiante, listarExamenesDisponibles);
router.post('/estudiante/examenes/:examen_id/iniciar', verificarToken, soloEstudiante, iniciarExamen);
router.get('/estudiante/intentos/:intento_id', verificarToken, soloEstudiante, obtenerIntento);
router.post('/estudiante/intentos/:intento_id/entregar', verificarToken, soloEstudiante, entregarExamen);
router.get('/estudiante/calificaciones', verificarToken, soloEstudiante, listarCalificaciones);

// Rutas de revisión (admin)
router.get('/revision/pendientes', verificarToken, soloAdmin, listarPendientesRevision);
router.patch('/revision/respuestas/:respuesta_id', verificarToken, soloAdmin, calificarRespuestaAbierta);

export default router;