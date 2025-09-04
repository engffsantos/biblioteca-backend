// index.js — compatível com Vercel (@vercel/node) e ambiente local
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

// Middlewares
app.use(cors({
    origin: '*', // PROD: restrinja ao domínio do frontend
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Inicialização do DB SEM top-level await
//    Criamos um "ready" global e aguardamos no middleware antes das rotas.
const ready = (async () => {
    try {
        await ensureSchema();
        console.log('[DB] Schema pronto');
    } catch (e) {
        console.error('[DB] Falha ao preparar schema:', e);
        throw e;
    }
})();

// Middleware que garante schema antes de atender
app.use(async (_req, _res, next) => {
    try {
        await ready;
        next();
    } catch (e) {
        next(e);
    }
});

// Endpoints de debug (opcionais)
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
        res.json({ count: r.rows[0].n });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

// Rotas principais
app.use('/api/library', libraryRoutes);
app.use('/api/akin', akinRoutes);

// ✅ Exporta o app para Vercel (@vercel/node)
export default app;

// ✅ Execução local (npm start / nodemon)
//    Em produção na Vercel, este bloco NÃO roda.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}`);
    });
}
