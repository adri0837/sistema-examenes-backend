import { Router } from 'express';
import { listarPreguntas, crearPregunta, editarPregunta, eliminarPregunta } from './preguntas.controller';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(verificarToken, soloAdmin);

router.get('/examenes/:examen_id/preguntas', listarPreguntas);
router.post('/examenes/:examen_id/preguntas', crearPregunta);
router.put('/preguntas/:id', editarPregunta);
router.delete('/preguntas/:id', eliminarPregunta);

export default router;