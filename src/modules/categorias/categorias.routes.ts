import { Router } from 'express';
import { listarCategorias, crearCategoria, editarCategoria, eliminarCategoria } from './categorias.controller';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(verificarToken, soloAdmin);

router.get('/', listarCategorias);
router.post('/', crearCategoria);
router.put('/:id', editarCategoria);
router.delete('/:id', eliminarCategoria);

export default router;