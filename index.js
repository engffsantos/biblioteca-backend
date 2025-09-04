// index.js — Express compatível com Vercel (@vercel/node) e execução local
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { ensureSchema, ping, exec } from './db.js';
import libraryRoutes from './routes/library.js';
import akinRoutes from './routes/akin.js';

// __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================
// App e Middlewares
// ============================
const app = express();

// 🔐 CORS — Domínios permitidos (produção + dev local)
//    Inclui seu frontend Vercel e o localhost para testes
const allowed = [
    'https://biblioteca-frontend-sage.vercel.app',
    'http://localhost:5173'
];

app.use(
    cors({
        origin: (origin, cb) => {
            // Requests sem Origin (ex.: Postman, SSR) -> libera
            if (!origin) return cb(null, true);
            if (allowed.includes(origin)) return cb(null, true);
            return cb(new Error(`CORS bloqueado para: ${origin}`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================
// Schema Turso (uma vez por cold start)
// ============================
const ready = (async () => {
    try {
        await ensureSchema();
        console.log('[DB] Schema pronto');
    } catch (e) {
        console.error('[DB] Falha ao preparar schema:', e);
        throw e;
    }
})();

// Middleware para garantir schema antes de cada rota
app.use(async (_req, _res, next) => {
    try {
        await ready;
        next();
    } catch (e) {
        next(e);
    }
});

// ============================
// Rotas de Debug / Health
// ============================
app.get('/api/_debug/ping-db', async (_req, res) => {
    try {
        const r = await ping();
        res.json({ ok: true, rows: r.rows });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

app.get('/api/_debug/library-count', async (_req, res) => {
    try {
        const r = await exec('SELECT COUNT(*) AS n FROM library_items');
        res.json({ count: Number(r.rows?.[0]?.n ?? 0) });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ============================
// Rotas principais (REST)
// ============================
app.use('/api/library', libraryRoutes);
app.use('/api/akin', akinRoutes);

// ============================
// Export para Vercel (@vercel/node)
// ============================
export default app;

// ============================
// Execução local (npm start / nodemon)
// ============================
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}`);
    });
}
