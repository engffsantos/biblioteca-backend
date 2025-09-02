// biblioteca-express/db.js
import { createClient } from '@libsql/client';

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  throw new Error('Turso: defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nas variáveis de ambiente da Vercel.');
}

export const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// Criação de tabela(s) se não existirem — rode uma vez por cold start.
// Ajuste o schema ao seu domínio real.
export async function ensureSchema() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS library_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,          -- 'Summae' | 'Tractatus' | 'LabText'
      title TEXT NOT NULL,
      author TEXT,
      ability TEXT,                -- opcional (ex.: para Summae/Tractatus)
      level INTEGER,               -- Summae
      quality INTEGER,             -- Summae/Tractatus
      category TEXT,               -- LabTextCategory
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
