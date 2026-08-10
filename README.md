# ⚙️ Sistema de Evaluaciones - Backend API

Este es el repositorio del **Backend** para la plataforma de evaluación académica. Está construido utilizando **Node.js** + **Express** + **TypeScript** + **Prisma ORM**.

## ✨ Funcionalidades

- **Autenticación** con JWT (roles `ADMIN` y `ESTUDIANTE`).
- **Gestión de usuarios, categorías, exámenes y preguntas**: múltiple opción, verdadero/falso, abierta, relacionar y completar.
- **Grupos**: creación de grupos, alta de estudiantes y asignación de exámenes con ventana de rendición (`fecha_inicio` / `fecha_fin`).
- **Flujo del estudiante**: listar exámenes disponibles según su grupo, iniciar, entregar y ver calificaciones.
- **Corrección automática**: preguntas de opción múltiple, verdadero/falso, relacionar y completar se corrigen en el servidor. Las preguntas abiertas quedan para revisión del admin.
- **Supervisión por cámara/micrófono**:
  - El estudiante reporta incidentes (`SIN_CAMARA`, `SIN_MICRO`, `CAMBIO_VENTANA`, `RUIDO_SOSPECHOSO`, etc.).
  - **2 llamadas de atención**: la primera es advertencia; la segunda cancela el examen automáticamente. Los tipos `SIN_PERMISOS` y `CIERRE_NAVEGADOR` cancelan directo.
  - **Análisis visual en Python** (`proctoring-service/`): FastAPI + MediaPipe analiza cada frame de la cámara y detecta movimiento, presencia de rostro, ojos cerrados, boca abierta y si el estudiante mira a la cámara o volteó la cabeza. El frontend consulta el análisis vía `POST /api/estudiante/intentos/:intento_id/analizar`, que actúa como proxy hacia el servicio Python.
  - **Evidencias** (capturas de pantalla, grabaciones de audio/video) subidas con `multipart/form-data` y servidas por URL pública o por endpoint protegido.
  - **Panel de supervisión para el admin**: intentos con incidentes y evidencias, reprobación y habilitación de reintentos.
- **Revisión manual**: el admin califica las respuestas abiertas y puede **reprobar** o **permitir reintento** de un intento cancelado/reprobado.
- **Reportes** por examen y por estudiante.

> 📖 Documentación completa de los endpoints en [`API.md`](./API.md).

##  Usuarios de prueba (seed)

El seed (`npx prisma db seed`) crea dos usuarios por defecto:

| Rol | Email | Contraseña |
| --- | --- | --- |
| ADMIN | `admin@examenes.com` | `admin123` |
| ESTUDIANTE | `estudiante@examenes.com` | `estudiante123` |

##  Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu máquina:
* [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
* Un gestor de paquetes como **npm** (viene incluido de forma automática al instalar Node.js)
* [PostgreSQL](https://www.postgresql.org/) (Asegúrate de tener el servicio de Postgres activo y corriendo localmente)

##  Configuración Inicial para Trabajo Local

Sigue estos pasos detallados para clonar el proyecto y levantar el entorno de desarrollo en tu computadora:

### 1. Clonar el repositorio

Si utilizas **GitHub Desktop**, simplemente ve a la página del repositorio en GitHub, haz clic en el botón verde **"Code"** y selecciona **"Open with GitHub Desktop"**. Clona el repositorio en la ruta donde trabajarás.

### 2. Instalar dependencias

Abre la terminal dentro de la carpeta del proyecto e instala todas las librerías necesarias ejecutando:

```bash
npm install
```
Nota: Esto creará la carpeta node_modules localmente con todo lo necesario para que React funcione. **NO TE PREOCUPES AL HACER PUSH EN GITHUB, GRACIAS AL ARCHIVO .gitignore NO SE SUBIRÁ ESE ARCHIVO, ENTONCES NO CAUSARÁ CONFLICTOS CON EL RESTO DEL EQUIPO**. 

### 3. Configurar variables de entorno (Archivo .env)
Crea un archivo llamado .env en la raíz del proyecto (si es que no se creó automáticamente). Abre el archivo y asegúrate de escribir tu cadena de conexión local de PostgreSQL:

```bash
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/sistema_examenes"
JWT_SECRET="cualquier_cadena_secreta_larga"
PORT=3000
# Opcional: apunta al servicio de análisis de proctoring (default http://127.0.0.1:8000/analizar)
PROCTORING_URL="http://127.0.0.1:8000/analizar"
```

Nota: Cambia **"TU_PASSWORD_LOCAL"** por la contraseña que realmente utilizas y **"nombre_de_tu_base_de_datos_local"** por el nombre exacto de la base de datos donde deseas trabajar. ESTE ARCHIVO TAMBIÉN ESTÁ EN EL .gitignore, POR LO QUE TUS CONTRASEÑAS LOCALES (el archivo .env) NUNCA SE SUBIRÁN A GITHUB NI AFECTARÁN A LOS DEMÁS.

### 4b. Servicio de análisis de proctoring (opcional pero recomendado)

Para habilitar el análisis visual de la cámara (movimiento, rostro, ojos y boca), levanta el servicio Python en `proctoring-service/`:

```bash
cd proctoring-service
pip install -r requirements.txt
python main.py
```

El servicio queda escuchando en `http://127.0.0.1:8000` (por defecto). Ver [`proctoring-service/README.md`](./proctoring-service/README.md).

### 4. Sincronizar la Base de Datos (Migración)
Para asegurarte de tener las mismas tablas que el resto del equipo en tu PostgreSQL local, ejecuta el comando de mapeo de Prisma:

```bash
npx prisma migrate dev --name init
```

Nota: Se creará una carpeta **prisma/migrations**, esta tambien se estará subiendo al control de versiónes, cuando hagas push al proyecto en github. Al utilizar el comando tambien se creará una tabla **_prisma_migrations** en Postgres, se puede visualizar en tu manejador de base de datos PGADMIN.

### 5. Arrancar el servidor de desarrollo
Para encender la API localmente y que procese las peticiones en tiempo real, ejecuta:

```Bash
npm run dev
```
### 6. Acceder a la aplicación
Una vez encendido el servidor, la terminal te mostrará la dirección local donde está escuchando activamente las peticiones (por defecto está configurado en http://localhost:3000).

### 7. Visualizar la base de datos en Prisma Studio
Para visualizar la base de datos en Prisma Studio, ejecuta el siguiente comando en la terminal:

```bash
npx prisma studio
```

### 8. Desarrollo de la aplicación (IMPORTANTE)
Todo el desarrollo de la lógica, rutas y controladores se encontrará en la carpeta src. Es necesario trabajar dentro de esta carpeta para no generar conflictos con la estructura del proyecto.

Si necesitas hacer modificaciones en las tablas de la base de datos, el archivo que debes editar es prisma/schema.prisma y posteriormente correr un comando de migración.

### 9. ¡IMPORTANTE! ANTES DE HACER PUSH (SUBIR TUS CAMBIOS AL PROYECTO) EN GITHUB
Recuerda que antes de subir tus cambios a GitHub debes asegurarte de que el archivo .gitignore esté actualizado para evitar conflictos con el resto del equipo.


📦 Tecnologías Principales Utilizadas
Node.js & Express - Entorno de ejecución y framework para la construcción de la API REST.

TypeScript - Tipado estático para un desarrollo más seguro y ordenado en el servidor.

Prisma ORM - Modelado de datos y mapeo directo con PostgreSQL.

Bcrypt & JWT - Herramientas para la encriptación de credenciales y manejo de sesiones seguras.