-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos_usuarios" (
    "id" TEXT NOT NULL,
    "grupo_id" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "agregado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_examen" (
    "id" TEXT NOT NULL,
    "grupo_id" TEXT NOT NULL,
    "examen_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "asignado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaciones_examen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grupos_nombre_key" ON "grupos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_usuarios_grupo_id_estudiante_id_key" ON "grupos_usuarios"("grupo_id", "estudiante_id");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_examen_grupo_id_examen_id_key" ON "asignaciones_examen"("grupo_id", "examen_id");

-- AddForeignKey
ALTER TABLE "grupos_usuarios" ADD CONSTRAINT "grupos_usuarios_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_usuarios" ADD CONSTRAINT "grupos_usuarios_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_examen" ADD CONSTRAINT "asignaciones_examen_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_examen" ADD CONSTRAINT "asignaciones_examen_examen_id_fkey" FOREIGN KEY ("examen_id") REFERENCES "examenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
