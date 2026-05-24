// Ejemplo de backend con express, solo para conectar con el frontend

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
    res.json({ message: '¡Backend funcionando correctamente!', status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});