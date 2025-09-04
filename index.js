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

/**
 * CORS — produção + previews + dev
 *
 * - Produção: https://biblioteca-frontend-sage.vercel.app
 * - Previews: https://biblioteca-frontend-sage-*.vercel.app
 * - Dev:      http://localhost:5173
 *
 * Também aceita lista por ENV (ALLOWED_ORIGINS="https://a, http://b").
 */
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

    // Permite previews do mesmo projeto na Vercel
    // Ex.: https://biblioteca-frontend-sage-<branch>-<hash>.vercel.app
    try {
        const url = new URL(origin);
        const host = url.hostname.toLowerCase();
        if (
            host.endsWith('.vercel.app') &&
            (host === 'biblioteca-frontend-sage.vercel.app' ||
                host.startsWith('biblioteca-frontend-sage-'))
        ) {
            return true;
        }
    } catch {
        // se origin for algo inválido, nega
    }

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

// Lida explicitamente com pré-flight (OPTIONS) para todas as rotas
app.options('*', corsMiddleware);

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

// Garante schema antes de qualquer rota
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
