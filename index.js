import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rotas
import libraryRoutes from './routes/library.js';
import akinRoutes from './routes/akin.js';

// Configurar dotenv
dotenv.config();

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: '*', // Permitir todas as origens para desenvolvimento
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
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

// Rota raiz
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

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

export default app;

