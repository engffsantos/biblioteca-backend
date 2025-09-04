// index.js — Express compatível com Vercel (@vercel/node)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { ensureSchema, ping, exec } from './db.js';
import libraryRoutes from './routes/library.js';
import akinRoutes from './routes/akin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/** CORS — prod + previews + dev + lista por ENV */
const STATIC_ALLOWED = [
    'https://biblioteca-frontend-sage.vercel.app',
    'http://localhost:5173',
];

const ENV_ALLOWED = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

function isAllowedOrigin(origin) {
    if (!origin) return true; // Postman/SSR
    if (STATIC_ALLOWED.includes(origin)) return true;
    if (ENV_ALLOWED.includes(origin)) return true;

    // Previews do mesmo projeto na Vercel:
    // ex.: https://biblioteca-frontend-sage-git-dev-xxxxx.vercel.app
    try {
        const host = new URL(origin).hostname.toLowerCase();
        if (
            host.endsWith('.vercel.app') &&
            (host === 'biblioteca-frontend-sage.vercel.app' ||
                host.startsWith('biblioteca-frontend-sage-'))
        ) return true;
    } catch {}
    return false;
}

const corsMiddleware = cors({
    origin: (origin, cb) => {
        const ok = isAllowedOrigin(origin);
        if (ok) return cb(null, true);
        console.warn('[CORS] BLOQUEADO para Origin:', origin);
        return cb(new Error(`CORS bloqueado para: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

app.use(corsMiddleware);
app.options('*', corsMiddleware); // pré-flight explícito

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Schema uma vez por cold start
const ready = (async () => { await ensureSchema(); })();
app.use(async (_req, _res, next) => { await ready; next(); });

// Debug & Health
app.get('/api/_debug/ping-db', async (_req, res) => {
    try { const r = await ping(); res.json({ ok: true, rows: r.rows }); }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});
app.get('/api/_debug/library-count', async (_req, res) => {
    try { const r = await exec('SELECT COUNT(*) AS n FROM library_items'); res.json({ count: Number(r.rows?.[0]?.n ?? 0) }); }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ✔️ Endpoint para "ver" CORS do seu navegador
app.get('/api/_debug/echo-cors', (req, res) => {
    const origin = req.headers.origin || null;
    const allowed = isAllowedOrigin(origin);
    res.json({ origin, allowed, hint: 'Veja o header Access-Control-Allow-Origin em Network.' });
});

// Rotas principais
app.use('/api/library', libraryRoutes);
app.use('/api/akin', akinRoutes);

export default app;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}
