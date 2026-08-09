import prisma from '../../config/prisma';
import { IncidenteTipo, TipoEvidencia } from '@prisma/client';

// Violaciones que imposibilitan continuar el examen: cancelan directo.
const TIPOS_CANCELACION_DIRECTA: IncidenteTipo[] = ['SIN_PERMISOS', 'CIERRE_NAVEGADOR'];

const PROCTORING_URL = process.env.PROCTORING_URL || 'http://127.0.0.1:8000/analizar';
const PROCTORING_TIMEOUT_MS = 4000;

export const analizarFrameService = async (
    intento_id: string,
    estudiante_id: string,
    frame: string
) => {
    const intento = await prisma.intento.findUnique({ where: { id: intento_id } });
    if (!intento) throw new Error('Intento no encontrado');
    if (intento.estudiante_id !== estudiante_id) throw new Error('No autorizado');
    if (intento.estado !== 'EN_PROGRESO') throw new Error('Este examen ya fue finalizado');

    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), PROCTORING_TIMEOUT_MS);

    try {
        const respuesta = await fetch(PROCTORING_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intento_id, frame }),
            signal: controlador.signal,
        });

        if (!respuesta.ok) {
            throw new Error(`El servicio de analisis respondio con estado ${respuesta.status}`);
        }

        return await respuesta.json();
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error('El servicio de analisis tardo demasiado en responder');
        }
        if (error?.cause?.code === 'ECONNREFUSED') {
            throw new Error('El servicio de analisis no esta disponible');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
};

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

    // Violaciones que cancelan de forma directa (no hay forma segura de continuar)
    if (TIPOS_CANCELACION_DIRECTA.includes(tipo)) {
        await cancelarExamenService(intento_id, estudiante_id);
        return {
            incidente,
            cancelado: true,
            advertencia: false,
            llamadas_atencion: intento.llamadas_atencion,
            motivo: `Examen cancelado por ${tipo.toLowerCase().replace(/_/g, ' ')}`,
        };
    }

    // Llamadas de atención: la primera es advertencia, la segunda cancela
    const nuevaLlamada = intento.llamadas_atencion + 1;

    if (nuevaLlamada >= 2) {
        await prisma.intento.update({
            where: { id: intento_id },
            data: {
                llamadas_atencion: nuevaLlamada,
                estado: 'CANCELADO',
                entregado_en: new Date(),
            },
        });
        return {
            incidente,
            cancelado: true,
            advertencia: false,
            llamadas_atencion: nuevaLlamada,
            strikes: nuevaLlamada,
            motivo: 'El examen fue cancelado por acumular dos llamadas de atención',
        };
    }

    await prisma.intento.update({
        where: { id: intento_id },
        data: { llamadas_atencion: nuevaLlamada },
    });

    return {
        incidente,
        cancelado: false,
        advertencia: true,
        llamadas_atencion: nuevaLlamada,
        strikes: nuevaLlamada,
        motivo: 'Primera llamada de atención. Si se repite, el examen se cancelará y será reprobado',
    };
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
        include: {
            evidencias: { select: { id: true, tipo: true, archivo: true, mime: true, creado_en: true } },
        },
        orderBy: { creado_en: 'asc' },
    });
};

export const subirEvidenciaService = async (
    intento_id: string,
    estudiante_id: string,
    tipo: TipoEvidencia,
    archivo: string,
    mime: string | null,
    tamano: number | null,
    incidente_id?: string
) => {
    const intento = await prisma.intento.findUnique({ where: { id: intento_id } });
    if (!intento) throw new Error('Intento no encontrado');
    if (intento.estudiante_id !== estudiante_id) throw new Error('No autorizado');
    if (intento.estado !== 'EN_PROGRESO' && intento.estado !== 'CANCELADO') {
        throw new Error('Este examen ya fue finalizado');
    }

    if (incidente_id) {
        const incidente = await prisma.incidenteSupervision.findUnique({ where: { id: incidente_id } });
        if (!incidente || incidente.intento_id !== intento_id) {
            throw new Error('El incidente indicado no pertenece a este intento');
        }
    }

    return prisma.evidencia.create({
        data: { intento_id, incidente_id: incidente_id || null, tipo, archivo, mime, tamano },
    });
};

export const listarEvidenciasService = async (intento_id: string) => {
    const intento = await prisma.intento.findUnique({ where: { id: intento_id } });
    if (!intento) throw new Error('Intento no encontrado');

    return prisma.evidencia.findMany({
        where: { intento_id },
        include: {
            incidente: { select: { id: true, tipo: true, descripcion: true, creado_en: true } },
        },
        orderBy: { creado_en: 'asc' },
    });
};

export const listarIntentosSupervisionService = async () => {
    return prisma.intento.findMany({
        where: { OR: [{ incidentes: { some: {} } }, { evidencias: { some: {} } }] },
        include: {
            estudiante: { select: { id: true, nombre: true, email: true } },
            examen: { select: { id: true, titulo: true } },
            _count: { select: { incidentes: true, evidencias: true } },
        },
        orderBy: { iniciado_en: 'desc' },
    });
};

export const obtenerEvidenciaService = async (id: string) => {
    const evidencia = await prisma.evidencia.findUnique({ where: { id } });
    if (!evidencia) throw new Error('Evidencia no encontrada');
    return evidencia;
};
