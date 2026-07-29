import prisma from '../../config/prisma';
import { IncidenteTipo } from '@prisma/client';

export const reportarIncidenteService = async (
    intento_id: string,
    estudiante_id: string,
    tipo: IncidenteTipo,
    descripcion?: string
) => {
    const intento = await prisma.intento.findUnique({ where: { id: intento_id } });
    if (!intento) throw new Error('Intento no encontrado');
    if (intento.estudiante_id !== estudiante_id) throw new Error('No autorizado');
    if (intento.estado !== 'EN_PROGRESO') throw new Error('Este examen ya fue finalizado');

    const incidente = await prisma.incidenteSupervision.create({
        data: { intento_id, tipo, descripcion },
    });

    // Auto-cancel on SIN_PERMISOS
    if (tipo === 'SIN_PERMISOS') {
        await cancelarExamenService(intento_id, estudiante_id);
        return { incidente, cancelado: true, motivo: 'Permisos denegados' };
    }

    // Auto-cancel on 3rd MOVIMIENTO_SOSPECHOSO
    if (tipo === 'MOVIMIENTO_SOSPECHOSO') {
        const count = await prisma.incidenteSupervision.count({
            where: { intento_id, tipo: 'MOVIMIENTO_SOSPECHOSO' },
        });
        if (count >= 3) {
            await cancelarExamenService(intento_id, estudiante_id);
            return { incidente, cancelado: true, motivo: `3 strikes de movimiento sospechoso` };
        }
        return { incidente, cancelado: false, strikes: count };
    }

    // Auto-cancel on direct-cancel types
    if (['CAMBIO_VENTANA', 'SALIR_PANTALLA_COMPLETA', 'RUIDO_SOSPECHOSO'].includes(tipo)) {
        await cancelarExamenService(intento_id, estudiante_id);
        return { incidente, cancelado: true, motivo: tipo.toLowerCase().replace(/_/g, ' ') };
    }

    return { incidente, cancelado: false };
};

export const cancelarExamenService = async (intento_id: string, estudiante_id: string) => {
    const intento = await prisma.intento.findUnique({ where: { id: intento_id } });
    if (!intento) throw new Error('Intento no encontrado');
    if (intento.estudiante_id !== estudiante_id) throw new Error('No autorizado');
    if (intento.estado !== 'EN_PROGRESO') throw new Error('Este examen ya fue finalizado');

    return prisma.intento.update({
        where: { id: intento_id },
        data: {
            estado: 'CANCELADO',
            entregado_en: new Date(),
        },
    });
};

export const listarIncidentesService = async (intento_id: string) => {
    return prisma.incidenteSupervision.findMany({
        where: { intento_id },
        orderBy: { creado_en: 'asc' },
    });
};
