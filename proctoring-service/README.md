# Servicio de analisis de proctoring (Python)

Servicio que analiza frames de camara durante un examen y detecta movimiento,
presencia de rostro, ojos cerrados, boca abierta y si la persona esta mirando
a la camara o volteo la cabeza.

## Requisitos

- Python 3.10+
- Dependencias (ver `requirements.txt`)

## Instalacion

```bash
cd proctoring-service
pip install -r requirements.txt
```

El modelo `models/face_landmarker.task` se descarga la primera vez o se puede
colocar manualmente desde:

```
https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
```

## Ejecucion

```bash
cd proctoring-service
python main.py
```

El servicio queda en `http://127.0.0.1:8000`.

## Endpoints

### `GET /health`

Health check. Responde `{"status": "ok"}`.

### `POST /analizar`

Recibe un frame de la camara y devuelve las metricas de analisis.

**Body (JSON):**

```json
{
  "intento_id": "uuid-del-intento",
  "frame": "<base64 del frame JPEG/PNG>"
}
```

**Respuesta (200):**

```json
{
  "movimiento": 0.23,
  "rostro_detectado": true,
  "ojos_cerrados": false,
  "boca_abierta": false,
  "mirando_camara": true,
  "cabeza_volteada": false,
  "yaw": -0.1,
  "parpadeo": 0.02,
  "mandibula": 0.05
}
```

- `movimiento`: proporcion de pixeles distintos entre el frame actual y el
  anterior del mismo intento (0 a 1).
- `ojos_cerrados`: el parpadeo excede el umbral (`eyeBlinkLeft/Right > 0.6`).
- `boca_abierta`: `jawOpen > 0.35`.
- `mirando_camara`: |yaw| < 0.35.
- `cabeza_volteada`: |yaw| >= 0.65.

El estado (frame previo para el diff) se mantiene en memoria por `intento_id`
y expira a los 5 minutos sin frames.
