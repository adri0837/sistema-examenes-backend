-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ESTUDIANTE');

-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('OPCION_MULTIPLE', 'VERDADERO_FALSO', 'ABIERTA', 'RELACIONAR', 'COMPLETAR');

-- CreateEnum
CREATE TYPE "EstadoIntento" AS ENUM ('EN_PROGRESO', 'ENTREGADO', 'CALIFICADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes" (
    "id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "tiempo_limite_min" INTEGER,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "examenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas" (
    "id" TEXT NOT NULL,
    "examen_id" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "tipo" "TipoPregunta" NOT NULL,
    "puntaje" DECIMAL(5,2) NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones_respuesta" (
    "id" TEXT NOT NULL,
    "pregunta_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "es_correcta" BOOLEAN NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "opciones_respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pares_relacion" (
    "id" TEXT NOT NULL,
    "pregunta_id" TEXT NOT NULL,
    "lado_izquierdo" TEXT NOT NULL,
    "lado_derecho" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "pares_relacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espacios_blanco" (
    "id" TEXT NOT NULL,
    "pregunta_id" TEXT NOT NULL,
    "numero_espacio" INTEGER NOT NULL,
    "respuesta_correcta" TEXT NOT NULL,

    CONSTRAINT "espacios_blanco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intentos" (
    "id" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "examen_id" TEXT NOT NULL,
    "estado" "EstadoIntento" NOT NULL,
    "calificacion_auto" DECIMAL(5,2),
    "calificacion_manual" DECIMAL(5,2),
    "calificacion_final" DECIMAL(5,2),
    "iniciado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entregado_en" TIMESTAMP(3),

    CONSTRAINT "intentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_estudiante" (
    "id" TEXT NOT NULL,
    "intento_id" TEXT NOT NULL,
    "pregunta_id" TEXT NOT NULL,
    "texto_respuesta" TEXT,
    "opciones_seleccionadas" TEXT[],
    "pares_relacionados" JSONB,
    "es_correcta" BOOLEAN,
    "puntaje_obtenido" DECIMAL(5,2),
    "revisado_por_admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "respuestas_estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "intentos_estudiante_id_examen_id_key" ON "intentos"("estudiante_id", "examen_id");

-- AddForeignKey
ALTER TABLE "examenes" ADD CONSTRAINT "examenes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_examen_id_fkey" FOREIGN KEY ("examen_id") REFERENCES "examenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_respuesta" ADD CONSTRAINT "opciones_respuesta_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "preguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pares_relacion" ADD CONSTRAINT "pares_relacion_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "preguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espacios_blanco" ADD CONSTRAINT "espacios_blanco_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "preguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos" ADD CONSTRAINT "intentos_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos" ADD CONSTRAINT "intentos_examen_id_fkey" FOREIGN KEY ("examen_id") REFERENCES "examenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_estudiante" ADD CONSTRAINT "respuestas_estudiante_intento_id_fkey" FOREIGN KEY ("intento_id") REFERENCES "intentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_estudiante" ADD CONSTRAINT "respuestas_estudiante_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "preguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
