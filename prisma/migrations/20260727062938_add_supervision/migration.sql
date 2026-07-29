-- CreateEnum
CREATE TYPE "IncidenteTipo" AS ENUM ('SIN_CAMARA', 'SIN_MICRO', 'SIN_PERMISOS', 'CAMBIO_VENTANA', 'CIERRE_NAVEGADOR', 'SALIR_PANTALLA_COMPLETA', 'MOVIMIENTO_SOSPECHOSO', 'RUIDO_SOSPECHOSO', 'COPIA');

-- AlterEnum
ALTER TYPE "EstadoIntento" ADD VALUE 'CANCELADO';

-- AlterTable
ALTER TABLE "examenes" ADD COLUMN     "supervision_activa" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "incidentes_supervision" (
    "id" TEXT NOT NULL,
    "intento_id" TEXT NOT NULL,
    "tipo" "IncidenteTipo" NOT NULL,
    "descripcion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidentes_supervision_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "incidentes_supervision" ADD CONSTRAINT "incidentes_supervision_intento_id_fkey" FOREIGN KEY ("intento_id") REFERENCES "intentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
