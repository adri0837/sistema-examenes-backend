import { Router } from 'express';
import { listarEstudiantes, crearEstudiante, toggleActivo } from './usuarios.controller';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(verificarToken, soloAdmin);

router.get('/', listarEstudiantes);
router.post('/', crearEstudiante);
router.patch('/:id/toggle-activo', toggleActivo);

export default router;