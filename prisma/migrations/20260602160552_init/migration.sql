/*
  Warnings:

  - You are about to drop the column `tiempo_limite_min` on the `examenes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "examenes" DROP COLUMN "tiempo_limite_min";

-- AlterTable
ALTER TABLE "preguntas" ADD COLUMN     "tiempo_limite_seg" INTEGER;
