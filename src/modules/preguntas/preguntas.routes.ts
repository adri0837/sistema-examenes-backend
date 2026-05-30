import { Router } from 'express';
import { listarPreguntas, crearPregunta, editarPregunta, eliminarPregunta } from './preguntas.controller';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.get('/examenes/:examen_id/preguntas', verificarToken, soloAdmin, listarPreguntas);
router.post('/examenes/:examen_id/preguntas', verificarToken, soloAdmin, crearPregunta);
router.put('/preguntas/:id', verificarToken, soloAdmin, editarPregunta);
router.delete('/preguntas/:id', verificarToken, soloAdmin, eliminarPregunta);

export default router;