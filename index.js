// index.js (backend)
// Carrega .env, inicializa Express e DB como já faz hoje…
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

// CORS amplo (em produção, restrinja ao domínio do front)
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// garante schema
await ensureSchema();

// debug endpoints (opcionais)
app.get('/api/_debug/ping-db', async (_req, res) => {
    try { const r = await ping(); res.json({ ok: true, rows: r.rows }); }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

app.get('/api/_debug/library-count', async (_req, res) => {
    try { const r = await exec('SELECT COUNT(*) AS n FROM library_items'); res.json({ count: r.rows[0].n }); }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

// rotas principais
app.use('/api/library', libraryRoutes);
app.use('/api/akin', akinRoutes);

// --- ✅ Exporta o app para a Vercel ---
// Em ambiente serverless, a Vercel encapsula o app; não chame app.listen.
export default app;

// --- Execução local (apenas quando você roda `node index.js`) ---
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}`);
    });
}
