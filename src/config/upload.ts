import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const DIR_EVIDENCIAS = path.resolve(process.cwd(), 'uploads', 'evidencias');

fs.mkdirSync(DIR_EVIDENCIAS, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, DIR_EVIDENCIAS),
    filename: (_req, _file, cb) => {
        const ext = path.extname(_file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${randomUUID()}${ext}`);
    },
});

export const subirEvidencia = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const permitido =
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('audio/') ||
            file.mimetype.startsWith('video/');
        if (permitido) cb(null, true);
        else cb(new Error('Tipo de archivo no permitido. Solo imágenes, audio o video'));
    },
});
