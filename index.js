// biblioteca-backend/index.js
// Carrega .env antes de qualquer outro módulo ser avaliado
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSchema } from './db.js';   // agora já encontra as envs

// Importar rotas
import libraryRoutes from './routes/library.js';
import akinRoutes from './routes/akin.js';


// Configurar __dirname para ES modules (substituto de __dirname do CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ====================
// Middlewares globais
// ====================
app.use(cors({
    origin: '*', // em produção troque pelo domínio real do frontend
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta /public
app.use(express.static(path.join(__dirname, 'public')));

// ====================
// Inicialização do banco
// ====================
await ensureSchema(); // cria tabela se não existir

// ====================
// Rotas da API
// ====================
app.use('/api/library', libraryRoutes);
app.use('/api/akin', akinRoutes);

// Rota de saúde
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Biblioteca Ars Magica API está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Rota raiz informativa
app.get('/', (req, res) => {
    res.json({
        message: 'Biblioteca Ars Magica API',
        version: '1.0.0',
        endpoints: {
            library: '/api/library',
            akin: '/api/akin',
            health: '/api/health'
        }
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ====================
// Iniciar servidor
// ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

export default app;
