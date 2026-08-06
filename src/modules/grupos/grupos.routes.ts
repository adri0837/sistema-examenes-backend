import { Router } from 'express';
import {
    listarGrupos,
    crearGrupo,
    detalleGrupo,
    editarGrupo,
    eliminarGrupo,
    agregarEstudiantes,
    quitarEstudiante,
    listarEstudiantesFueraDeGrupo,
    asignarExamen,
    editarAsignacion,
    desasignarExamen,
} from './grupos.controller';
import { verificarToken } from '../../middlewares/auth.middleware';
import { soloAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(verificarToken, soloAdmin);

router.get('/', listarGrupos);
router.post('/', crearGrupo);
router.get('/:id', detalleGrupo);
router.put('/:id', editarGrupo);
router.delete('/:id', eliminarGrupo);
router.get('/:id/estudiantes/disponibles', listarEstudiantesFueraDeGrupo);
router.post('/:id/estudiantes', agregarEstudiantes);
router.delete('/:id/estudiantes/:estudiante_id', quitarEstudiante);
router.post('/:id/examenes', asignarExamen);
router.put('/:id/examenes/:examen_id', editarAsignacion);
router.delete('/:id/examenes/:examen_id', desasignarExamen);

export default router;
