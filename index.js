// biblioteca-backend/index.js
// Carrega variáveis do .env ANTES de qualquer outro import (robusto em ESM)
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// DB helpers e schema
import { ensureSchema, ping, exec } from './db.js';

// Rotas
import libraryRoutes from './routes/library.js';
import akinRoutes from './routes/akin.js';

// __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ====================
// Middlewares
// ====================
app.use(cors({
    origin: '*', // PRODUÇÃO: restrinja ao domínio do frontend
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos (opcional)
app.use(express.static(path.join(__dirname, 'public')));

// ====================
// Inicialização DB
// ====================
await ensureSchema(); // cria tabelas se não existirem (biblioteca + AKIN)

// ====================
// Endpoints de Debug
// ====================
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
        res.json({ count: r.rows[0]?.n ?? 0 });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

// ====================
// Rotas da API
// ====================
app.use('/api/library', libraryRoutes);
app.use('/api/akin', akinRoutes);

// Saúde
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        message: 'Biblioteca Ars Magica API está funcionando!',
        timestamp: new Date().toISOString(),
    });
});

// Raiz
app.get('/', (_req, res) => {
    res.json({
        message: 'Biblioteca Ars Magica API',
        version: '1.0.0',
        endpoints: {
            library: '/api/library',
            akin: '/api/akin',
            health: '/api/health',
        },
    });
});

// Erros
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    console.error(err?.stack || err);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// 404
app.use('*', (_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ====================
// Start
// ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

export default app;
