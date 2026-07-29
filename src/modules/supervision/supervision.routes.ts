import { Router } from 'express';
import {
    reportarIncidente,
    cancelarExamen,
    listarIncidentes,
} from './supervision.controller';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloEstudiante, soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.post('/estudiante/intentos/:intento_id/incidentes', verificarToken, soloEstudiante, reportarIncidente);
router.post('/estudiante/intentos/:intento_id/cancelar', verificarToken, soloEstudiante, cancelarExamen);
router.get('/admin/intentos/:intento_id/incidentes', verificarToken, soloAdmin, listarIncidentes);

export default router;
