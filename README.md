# ⚙️ Sistema de Evaluaciones - Backend API

Este es el repositorio del **Backend** para la plataforma de evaluación académica. Está construido utilizando **Node.js** + **Express** + **TypeScript** + **Prisma ORM**.

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
DATABASE_URL="postgresql://postgres:TU_PASSWORD_LOCAL@localhost:5432/nombre_de_tu_base_de_datos_local?schema=public"
```

Nota: Cambia **"TU_PASSWORD_LOCAL"** por la contraseña que realmente utilizas y **"nombre_de_tu_base_de_datos_local"** por el nombre exacto de la base de datos donde deseas trabajar. ESTE ARCHIVO TAMBIÉN ESTÁ EN EL .gitignore, POR LO QUE TUS CONTRASEÑAS LOCALES (el archivo .env) NUNCA SE SUBIRÁN A GITHUB NI AFECTARÁN A LOS DEMÁS.

### 4. Sincronizar la Base de Datos (Migración)
Para asegurarte de tener las mismas tablas que el resto del equipo en tu PostgreSQL local, ejecuta el comando de mapeo de Prisma:

```bash
npx prisma migrate dev --name init
```

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