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
  // Tabela da biblioteca (mantida)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS library_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      ability TEXT,
      level INTEGER,
      quality INTEGER,
      category TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // --- AKIN ---

  // Perfil (1 registro "akin" ou múltiplos perfis se desejar)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS akin_profile (
      id TEXT PRIMARY KEY,              -- ex.: 'akin'
      name TEXT,
      house TEXT,
      age INTEGER,
      characteristics_json TEXT,        -- JSON string (int, per, str, etc.)
      arts_json TEXT,                   -- JSON string (creo, intellego, etc.)
      spells TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Abilities
  await db.execute(`
    CREATE TABLE IF NOT EXISTS akin_abilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value INTEGER NOT NULL,
      specialty TEXT
    );
  `);

  // Virtues
  await db.execute(`
    CREATE TABLE IF NOT EXISTS akin_virtues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      is_major INTEGER NOT NULL DEFAULT 0,   -- 0=false, 1=true
      page INTEGER
    );
  `);

  // Flaws
  await db.execute(`
    CREATE TABLE IF NOT EXISTS akin_flaws (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      is_major INTEGER NOT NULL DEFAULT 0,
      page INTEGER
    );
  `);
}
