import { Router } from 'express';
import { listarExamenes, crearExamen, editarExamen, eliminarExamen, togglePublicado } from './examenes.controller';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(verificarToken, soloAdmin);

router.get('/', listarExamenes);
router.post('/', crearExamen);
router.put('/:id', editarExamen);
router.delete('/:id', eliminarExamen);
router.patch('/:id/toggle-publicado', togglePublicado);

export default router;