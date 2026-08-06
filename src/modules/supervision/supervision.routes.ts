import { Router } from 'express';
import {
    reportarIncidente,
    cancelarExamen,
    listarIncidentes,
    subirEvidencia,
    listarEvidencias,
    descargarEvidencia,
} from './supervision.controller';
import { subirEvidencia as multerSubirEvidencia } from '../../config/upload';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloEstudiante, soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.post('/estudiante/intentos/:intento_id/incidentes', verificarToken, soloEstudiante, reportarIncidente);
router.post('/estudiante/intentos/:intento_id/cancelar', verificarToken, soloEstudiante, cancelarExamen);
router.post(
    '/estudiante/intentos/:intento_id/evidencias',
    verificarToken,
    soloEstudiante,
    multerSubirEvidencia.single('archivo'),
    subirEvidencia
);
router.get('/admin/intentos/:intento_id/incidentes', verificarToken, soloAdmin, listarIncidentes);
router.get('/admin/intentos/:intento_id/evidencias', verificarToken, soloAdmin, listarEvidencias);
router.get('/admin/evidencias/:evidencia_id/archivo', verificarToken, soloAdmin, descargarEvidencia);

export default router;
