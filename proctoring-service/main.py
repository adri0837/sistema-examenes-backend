import base64
import time
import threading
from typing import Dict, Optional

import cv2
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mediapipe.tasks.python import vision as mp_vision
from pydantic import BaseModel

mp_python = mp.tasks

MODEL_PATH = "models/face_landmarker.task"

BaseOptions = mp_python.BaseOptions
FaceLandmarker = mp_vision.FaceLandmarker
FaceLandmarkerOptions = mp_vision.FaceLandmarkerOptions

face_landmarker = FaceLandmarker.create_from_options(
    FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        num_faces=1,
        output_face_blendshapes=True,
        min_face_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )
)

BLINK_LEFT = "eyeBlinkLeft"
BLINK_RIGHT = "eyeBlinkRight"
JAW_OPEN = "jawOpen"
HEAD_YAW_UP = "headRollLeft"
HEAD_YAW_DOWN = "headRollRight"

# Landmark indices used for head-pose estimation
NOSE_TIP = 1
LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263

# Frame-diff motion threshold (0-1)
MOTION_UMBRAL = 0.35

# Persisted state per intento: last frame for motion diff
estados: Dict[str, Dict] = {}
_lock = threading.Lock()

TLL_ESTADOS_S = 300  # drop state after 5 min of no frames


class AnalisisRequest(BaseModel):
    intento_id: str
    frame: str  # base64-encoded JPEG/PNG


def _decodificar_frame(b64: str) -> np.ndarray:
    raw = base64.b64decode(b64)
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Frame invalido: no se pudo decodificar")
    return img


def _diff_previo(intento_id: str, gris: np.ndarray) -> float:
    now = time.time()
    with _lock:
        estado = estados.get(intento_id)
        if estado is None or estado["shape"] != gris.shape:
            estados[intento_id] = {"frame": gris, "shape": gris.shape, "ts": now}
            return 0.0
        prev = estado["frame"]
        estado["frame"] = gris
        estado["ts"] = now
        diff = cv2.absdiff(prev, gris)
        return float(np.mean(diff) / 255.0)


def _metrics(landmarks, blendshape) -> Dict:
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])

    def shape_value(nombre: str) -> float:
        for cat in blendshape:
            if cat.category_name == nombre:
                return float(cat.score)
        return 0.0

    parpadeo = (shape_value(BLINK_LEFT) + shape_value(BLINK_RIGHT)) / 2.0
    mandibula = shape_value(JAW_OPEN)

    nariz_x = pts[NOSE_TIP][0]
    ojo_izq_x = pts[LEFT_EYE_OUTER][0]
    ojo_der_x = pts[RIGHT_EYE_OUTER][0]
    centro_ojos = (ojo_izq_x + ojo_der_x) / 2.0
    ancho_ojos = max(ojo_der_x - ojo_izq_x, 1e-6)
    yaw = (nariz_x - centro_ojos) / ancho_ojos

    return {
        "ojos_cerrados": bool(parpadeo > 0.6),
        "boca_abierta": bool(mandibula > 0.35),
        "mirando_camara": bool(abs(yaw) < 0.35),
        "cabeza_volteada": bool(abs(yaw) >= 0.65),
        "yaw": round(float(yaw), 4),
        "parpadeo": round(float(parpadeo), 4),
        "mandibula": round(float(mandibula), 4),
    }


def _limpiar_estados():
    now = time.time()
    with _lock:
        viejos = [k for k, v in estados.items() if now - v["ts"] > TLL_ESTADOS_S]
        for k in viejos:
            del estados[k]


app = FastAPI(title="Servicio de analisis de proctoring")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analizar")
def analizar(req: AnalisisRequest):
    img = _decodificar_frame(req.frame)
    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    movimiento = _diff_previo(req.intento_id, gris)

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img)
    resultado = face_landmarker.detect(mp_image)

    if not resultado.face_landmarks:
        _limpiar_estados()
        return {
            "movimiento": round(movimiento, 4),
            "rostro_detectado": False,
            "ojos_cerrados": False,
            "boca_abierta": False,
            "mirando_camara": False,
            "cabeza_volteada": False,
            "yaw": 0.0,
            "parpadeo": 0.0,
            "mandibula": 0.0,
        }

    metrics = _metrics(
        resultado.face_landmarks[0], resultado.face_blendshapes[0]
    )
    return {
        "movimiento": round(movimiento, 4),
        "rostro_detectado": True,
        **metrics,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
