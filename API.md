# 📖 API - Sistema de Evaluaciones (Backend)

Todas las rutas están bajo el prefijo `http://localhost:3000/api` (a menos que se indique lo contrario).

**Autenticación**: la mayoría de los endpoints requieren el header `Authorization: Bearer <token>`. El token se obtiene de `POST /api/auth/login` y expira a las 8 horas.

**Roles**: `ADMIN` = administrador, `ESTUDIANTE` = estudiante.

---

## 🔐 Autenticación

### POST `/api/auth/login`
Acceso público. Inicia sesión y devuelve el token JWT.

Body:
```json
{
  "email": "admin@examenes.com",
  "password": "admin123"
}
```

Respuesta `200`:
```json
{
  "token": "eyJhbGciOi...",
  "usuario": {
    "id": "uuid",
    "nombre": "Administrador",
    "email": "admin@examenes.com",
    "rol": "ADMIN"
  }
}
```

### POST `/api/auth/registro`
Acceso público. Registra un usuario con rol `ESTUDIANTE`.

Body:
```json
{
  "nombre": "Nombre del estudiante",
  "email": "estudiante@ejemplo.com",
  "password": "123456"
}
```

Respuesta `201`: objeto `usuario` (sin contraseña).

---

## 👤 Usuarios (solo ADMIN)

### GET `/api/usuarios`
Lista todos los estudiantes.

### POST `/api/usuarios`
Crea un estudiante.

Body:
```json
{
  "nombre": "Ana Pérez",
  "email": "ana@ejemplo.com",
  "password": "123456"
}
```

Respuesta `201`: usuario creado.

### PATCH `/api/usuarios/:id/toggle-activo`
Activa/desactiva un estudiante. Un usuario desactivado no puede iniciar sesión ni rendir.

### DELETE `/api/usuarios/:id`
Elimina un estudiante.

---

## 🗂️ Categorías (solo ADMIN)

### GET `/api/categorias`
Lista todas las categorías.

### POST `/api/categorias`
Body:
```json
{
  "nombre": "Matemática",
  "descripcion": "Opcional"
}
```

Respuesta `201`: categoría creada.

### PUT `/api/categorias/:id`
Actualiza `nombre` y `descripcion`.

### DELETE `/api/categorias/:id`
Elimina una categoría.

---

## 📝 Exámenes (solo ADMIN)

### GET `/api/examenes`
Lista exámenes con su categoría, cantidad de intentos y asignaciones a grupos.

### POST `/api/examenes`
Body:
```json
{
  "titulo": "Parcial 1",
  "descripcion": "Opcional",
  "categoria_id": "uuid-de-categoria",
  "supervision_activa": true
}
```

`supervision_activa` (default `false`) habilita el flujo de supervisión por cámara/micrófono para ese examen.

Respuesta `201`: examen creado.

### PUT `/api/examenes/:id`
Edita título, descripción, categoría y/o `supervision_activa`.

### DELETE `/api/examenes/:id`
Elimina el examen y sus datos relacionados (intentos, incidentes, respuestas, preguntas).

> ⚠️ Al eliminar un examen se borran los intentos/incidentes pero **no** los archivos de evidencias subidos en `uploads/evidencias/`.

### PATCH `/api/examenes/:id/toggle-publicado`
Publica/despublica el examen. Solo los exámenes publicados aparecen en "disponibles" del estudiante.

### DELETE `/api/examenes/:id/intentos`
Elimina todos los intentos del examen (y sus incidentes/respuestas). Útil para resetear un examen.

---

## ❓ Preguntas (solo ADMIN)

### GET `/api/examenes/:examen_id/preguntas`
Lista las preguntas de un examen (con opciones, pares y espacios).

### POST `/api/examenes/:examen_id/preguntas`
Crea una pregunta. El `tipo` define qué campos anidados se usan:

| `tipo` | Campos requeridos |
| --- | --- |
| `OPCION_MULTIPLE` | `opciones` |
| `VERDADERO_FALSO` | `opciones` |
| `RELACIONAR` | `pares` |
| `COMPLETAR` | `espacios` |
| `ABIERTA` | ninguno |

Body:
```json
{
  "enunciado": "¿Cuántas letras tiene la palabra E2E?",
  "tipo": "OPCION_MULTIPLE",
  "puntaje": 10,
  "tiempo_limite_seg": 60,
  "opciones": [
    { "texto": "dos", "es_correcta": false },
    { "texto": "tres", "es_correcta": true }
  ]
}
```

Ejemplos de los otros tipos:
```json
// RELACIONAR
{ "enunciado": "Unir cada concepto", "tipo": "RELACIONAR", "puntaje": 10,
  "pares": [
    { "lado_izquierdo": "HTTP", "lado_derecho": "Protocolo de transferencia" },
    { "lado_izquierdo": "SQL", "lado_derecho": "Lenguaje de consulta" }
  ] }

// COMPLETAR
{ "enunciado": "La capital de Francia es ___", "tipo": "COMPLETAR", "puntaje": 10,
  "espacios": [ { "respuesta_correcta": "París" } ] }

// VERDADERO_FALSO
{ "enunciado": "El agua hierve a 100°C", "tipo": "VERDADERO_FALSO", "puntaje": 10,
  "opciones": [ { "texto": "Verdadero", "es_correcta": true }, { "texto": "Falso", "es_correcta": false } ] }

// ABIERTA
{ "enunciado": "Explica el teorema de Pitágoras", "tipo": "ABIERTA", "puntaje": 10 }
```

Respuesta `201`: pregunta creada. No se pueden crear/modificar preguntas en un examen que ya tiene intentos.

### PUT `/api/preguntas/:id`
Edita la pregunta (mismos campos que el POST, sin `tipo`).

### DELETE `/api/preguntas/:id`
Elimina la pregunta y sus datos relacionados.

---

## 🎓 Flujo del estudiante

### GET `/api/estudiante/examenes-disponibles`
Requiere `ESTUDIANTE`. Lista los exámenes publicados asignados a los grupos del estudiante **dentro de su ventana de rendición**. Incluye la asignación y el intento más reciente (con `llamadas_atencion`, `reintento_permitido`, `motivo_admin`).

### POST `/api/estudiante/examenes/:examen_id/iniciar`
Requiere `ESTUDIANTE`. Crea un intento `EN_PROGRESO`.

Reglas:
- El examen debe estar publicado y asignado al estudiante.
- Debe estar dentro de la ventana `fecha_inicio`/`fecha_fin`.
- No se permite iniciar si ya hay un intento en progreso.
- Si el intento previo está `CANCELADO` o `REPROBADO`, solo se puede reintentar si el admin habilitó `reintento_permitido`.

Respuesta `201`: `{ intento, examen, preguntas }`. **Importante**: las opciones no incluyen `es_correcta` (anti-trampa).

### GET `/api/estudiante/intentos/:intento_id`
Requiere `ESTUDIANTE`. Obtiene el intento en curso (solo si está `EN_PROGRESO`).

### POST `/api/estudiante/intentos/:intento_id/entregar`
Requiere `ESTUDIANTE`. Entrega el examen.

Body:
```json
{
  "respuestas": [
    {
      "pregunta_id": "uuid",
      "opciones_seleccionadas": ["uuid-opcion-correcta"],
      "texto_respuesta": "Solo para ABIERTA",
      "pares_relacionados": [ { "izquierdo": "HTTP", "derecho": "Protocolo de transferencia" } ],
      "espacios_respuestas": ["París"]
    }
  ]
}
```

- Las preguntas `OPCION_MULTIPLE`, `VERDADERO_FALSO`, `RELACIONAR` y `COMPLETAR` se corrigen automáticamente en el servidor.
- Los valores `null` dentro de `opciones_seleccionadas` / `pares_relacionados` / `espacios_respuestas` se filtran (robustez ante respuestas incompletas).
- Si hay preguntas abiertas, el intento queda `ENTREGADO` y `calificacion_final` en `null` hasta la revisión del admin.
- Si no las hay, queda `CALIFICADO` con `calificacion_auto`/`calificacion_final` en escala 0–100.

### GET `/api/estudiante/calificaciones`
Requiere `ESTUDIANTE`. Lista los intentos del estudiante con examen, categoría y calificaciones.

---

## 🧐 Revisión y oportunidades (solo ADMIN)

### GET `/api/revision/pendientes`
Lista intentos `ENTREGADO` con respuestas abiertas sin calificar.

### PATCH `/api/revision/respuestas/:respuesta_id`
Califica una respuesta abierta.

Body:
```json
{ "puntaje_obtenido": 8 }
```

Cuando se califica la última abierta pendiente del intento, este pasa a `CALIFICADO` y se calcula `calificacion_manual` y `calificacion_final`.

### DELETE `/api/admin/estudiantes/:estudiante_id/examenes/:examen_id/oportunidad`
Otorga una segunda oportunidad: elimina el intento previo (incidentes, respuestas e intento) para permitir uno nuevo.

### PATCH `/api/admin/intentos/:intento_id/reprobar`
Marca un intento como `REPROBADO`. Descarta las respuestas y limpia las calificaciones.

Body (opcional):
```json
{ "motivo": "copia detectada en revisión" }
```

### PATCH `/api/admin/intentos/:intento_id/permitir-reintento`
Habilita el reintento de un intento `REPROBADO` o `CANCELADO`.

Body (opcional):
```json
{ "motivo": "falla técnica" }
```

---

## 🛡️ Supervisión (incidentes y evidencias)

### POST `/api/estudiante/intentos/:intento_id/analizar`
Requiere `ESTUDIANTE`. Envía un frame de la cámara al **servicio de análisis de proctoring** (Python + MediaPipe) y devuelve las métricas de supervisión visual.

Body:
```json
{
  "frame": "<frame JPEG/PNG en base64>"
}
```

El backend reenvía el frame al servicio Python (`PROCTORING_URL`, por defecto `http://127.0.0.1:8000/analizar`). El `frame` debe ser el mismo tamaño en cada llamada del mismo intento para que el cálculo de movimiento funcione.

Respuesta `200`:
```json
{
  "movimiento": 0.38,
  "rostro_detectado": true,
  "ojos_cerrados": false,
  "boca_abierta": false,
  "mirando_camara": true,
  "cabeza_volteada": false,
  "yaw": 0.09,
  "parpadeo": 0.06,
  "mandibula": 0.0
}
```

- `movimiento`: proporción de píxeles distintos entre el frame actual y el anterior del mismo intento (0–1).
- `ojos_cerrados`: ambos ojos cerrados según blendshapes (`eyeBlink*`).
- `boca_abierta`: mandíbula abierta (`jawOpen > 0.35`).
- `mirando_camara` / `cabeza_volteada`: posición de la nariz relativa a los ojos (`|yaw|`).

Respuestas de error: `400` si falta el frame, `503` si el intento no existe/pertenece a otro estudiante o ya finalizó, o si el servicio Python no está disponible. El frontend degrada la supervisión visual (no reporta incidentes de cámara) cuando recibe `503`.

### POST `/api/estudiante/intentos/:intento_id/incidentes`
Requiere `ESTUDIANTE`. Reporta un incidente de supervisión.

Body:
```json
{
  "tipo": "CAMBIO_VENTANA",
  "descripcion": "Opcional"
}
```

Tipos válidos de incidente:
| `tipo` | Efecto |
| --- | --- |
| `SIN_PERMISOS` | Cancela directo |
| `CIERRE_NAVEGADOR` | Cancela directo |
| `SIN_CAMARA` | Suma llamada de atención |
| `SIN_MICRO` | Suma llamada de atención |
| `CAMBIO_VENTANA` | Suma llamada de atención |
| `SALIR_PANTALLA_COMPLETA` | Suma llamada de atención |
| `MOVIMIENTO_SOSPECHOSO` | Suma llamada de atención |
| `RUIDO_SOSPECHOSO` | Suma llamada de atención |
| `COPIA` | Suma llamada de atención |

Lógica de llamadas de atención:
- **1er incidente** (no directo) → `advertencia: true`, `llamadas_atencion: 1`.
- **2do incidente** → cancela el intento (`estado: CANCELADO`), `cancelado: true`, `llamadas_atencion: 2`.
- **SIN_PERMISOS / CIERRE_NAVEGADOR** → cancela directo en el primer incidente.

Respuesta `201`:
```json
{
  "incidente": { "id": "uuid", "intento_id": "uuid", "tipo": "CAMBIO_VENTANA", "descripcion": null },
  "cancelado": false,
  "advertencia": true,
  "llamadas_atencion": 1,
  "strikes": 1,
  "motivo": "Primera llamada de atención. Si se repite, el examen se cancelará y será reprobado"
}
```

### POST `/api/estudiante/intentos/:intento_id/cancelar`
Requiere `ESTUDIANTE`. Cancela el examen manualmente (el estudiante lo abandona).

### POST `/api/estudiante/intentos/:intento_id/evidencias`
Requiere `ESTUDIANTE`. Sube una evidencia en `multipart/form-data` (imagen, audio o video, máx. 50 MB).

Form-data:
- `archivo`: el archivo (campo `file`).
- `tipo`: `CAPTURA` o `GRABACION`.
- `incidente_id` (opcional): incidente al que se asocia.

Respuesta `201`:
```json
{
  "id": "uuid",
  "intento_id": "uuid",
  "incidente_id": "uuid",
  "tipo": "CAPTURA",
  "archivo": "1786059264431-55e15d7e-....png",
  "mime": "image/png",
  "tamano": 67,
  "url": "/uploads/evidencias/1786059264431-55e15d7e-....png"
}
```

### GET `/api/admin/supervision/intentos`
Requiere `ADMIN`. Lista intentos con al menos un incidente o evidencia, incluyendo estudiante, examen, `_count.incidentes` y `_count.evidencias`.

### GET `/api/admin/intentos/:intento_id/incidentes`
Requiere `ADMIN`. Lista los incidentes de un intento (con sus evidencias asociadas).

### GET `/api/admin/intentos/:intento_id/evidencias`
Requiere `ADMIN`. Lista las evidencias de un intento con su `url` pública.

### GET `/api/admin/evidencias/:evidencia_id/archivo`
Requiere `ADMIN`. Descarga el archivo de una evidencia (con `Content-Type` según el `mime`).

> Archivos servidos estáticamente: la UI puede mostrar las evidencias vía `http://localhost:3000/uploads/evidencias/<archivo>`.

---

## 📊 Reportes (solo ADMIN)

### GET `/api/reportes/examenes`
Lista exámenes para el selector de reportes.

### GET `/api/reportes/estudiantes`
Lista estudiantes activos para el selector de reportes.

### GET `/api/reportes/por-examen/:examen_id`
Reporte de un examen con todos sus intentos y estudiantes.

### GET `/api/reportes/por-estudiante/:estudiante_id`
Reporte de un estudiante con todos sus intentos y exámenes.

---

## 👥 Grupos (solo ADMIN)

### GET `/api/grupos`
Lista grupos con cantidad de estudiantes y de exámenes asignados.

### POST `/api/grupos`
Body:
```json
{
  "nombre": "Comisión A",
  "descripcion": "Opcional"
}
```

El nombre es único.

### GET `/api/grupos/:id`
Detalle del grupo: miembros y exámenes asignados.

### PUT `/api/grupos/:id`
Edita `nombre` y `descripcion`.

### DELETE `/api/grupos/:id`
Elimina el grupo (las membresías y asignaciones se borran en cascada).

### GET `/api/grupos/:id/estudiantes/disponibles`
Lista estudiantes activos que **no** pertenecen al grupo.

### POST `/api/grupos/:id/estudiantes`
Agrega estudiantes al grupo.

Body:
```json
{ "estudiante_ids": ["uuid-1", "uuid-2"] }
```

### DELETE `/api/grupos/:id/estudiantes/:estudiante_id`
Quita un estudiante del grupo.

### POST `/api/grupos/:id/examenes`
Asigna un examen al grupo con una ventana de rendición.

Body:
```json
{
  "examen_id": "uuid",
  "fecha_inicio": "2026-08-06T18:00:00.000Z",
  "fecha_fin": "2026-08-08T23:59:59.000Z"
}
```

Las fechas son opcionales (si se omiten, no hay restricción de ventana). El estudiante solo verá el examen en "disponibles" dentro de esa ventana.

### PUT `/api/grupos/:id/examenes/:examen_id`
Actualiza `fecha_inicio` y/o `fecha_fin` de la asignación.

### DELETE `/api/grupos/:id/examenes/:examen_id`
Desasigna el examen del grupo.

---

## 🧩 Estados de un intento

| Estado | Descripción |
| --- | --- |
| `EN_PROGRESO` | El estudiante está rindiendo |
| `ENTREGADO` | Entregado con abiertas pendientes de revisión |
| `CALIFICADO` | Calificación final disponible |
| `CANCELADO` | Cancelado por supervisión o abandono |
| `REPROBADO` | Reprobado por el admin |

## 🔄 Enums

- **Rol**: `ADMIN`, `ESTUDIANTE`
- **TipoPregunta**: `OPCION_MULTIPLE`, `VERDADERO_FALSO`, `ABIERTA`, `RELACIONAR`, `COMPLETAR`
- **EstadoIntento**: `EN_PROGRESO`, `ENTREGADO`, `CALIFICADO`, `CANCELADO`, `REPROBADO`
- **TipoEvidencia**: `CAPTURA`, `GRABACION`
- **IncidenteTipo**: `SIN_CAMARA`, `SIN_MICRO`, `SIN_PERMISOS`, `CAMBIO_VENTANA`, `CIERRE_NAVEGADOR`, `SALIR_PANTALLA_COMPLETA`, `MOVIMIENTO_SOSPECHOSO`, `RUIDO_SOSPECHOSO`, `COPIA`
