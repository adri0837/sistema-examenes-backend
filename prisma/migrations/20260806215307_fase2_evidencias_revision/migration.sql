-- CreateEnum
CREATE TYPE "TipoEvidencia" AS ENUM ('CAPTURA', 'GRABACION');

-- AlterEnum
ALTER TYPE "EstadoIntento" ADD VALUE 'REPROBADO';

-- AlterTable
ALTER TABLE "intentos" ADD COLUMN     "llamadas_atencion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "motivo_admin" TEXT,
ADD COLUMN     "reintento_permitido" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "evidencias" (
    "id" TEXT NOT NULL,
    "intento_id" TEXT NOT NULL,
    "incidente_id" TEXT,
    "tipo" "TipoEvidencia" NOT NULL,
    "archivo" TEXT NOT NULL,
    "mime" TEXT,
    "tamano" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_intento_id_fkey" FOREIGN KEY ("intento_id") REFERENCES "intentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_incidente_id_fkey" FOREIGN KEY ("incidente_id") REFERENCES "incidentes_supervision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
