import { Router } from 'express';
import { reportePorExamen, reportePorEstudiante, listarExamenesParaReporte, listarEstudiantesParaReporte } from './reportes.controller';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(verificarToken, soloAdmin);

router.get('/examenes', listarExamenesParaReporte);
router.get('/estudiantes', listarEstudiantesParaReporte);
router.get('/por-examen/:examen_id', reportePorExamen);
router.get('/por-estudiante/:estudiante_id', reportePorEstudiante);

export default router;