// biblioteca-backend/db.js
import { createClient } from '@libsql/client';

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  throw new Error('Turso: defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nas variáveis de ambiente.');
}

// Cliente Turso
export const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// Helper com logs (todas as queries das rotas usarão este)
export async function exec(sql, args = []) {
  try {
    console.log('[DB] SQL:', sql.trim().replace(/\s+/g, ' '), 'ARGS:', args);
    const res = await db.execute({ sql, args });
    return res;
  } catch (e) {
    console.error('[DB] ERROR on', sql, 'ARGS:', args, '\n', e);
    throw e;
  }
}

// Ping simples para validar auth/conexão
export async function ping() {
  return exec('SELECT 1 AS ok');
}

// Cria tabelas se não existirem (biblioteca + AKIN)
export async function ensureSchema() {
  // Biblioteca
  await exec(`
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

  // AKIN
  await exec(`
    CREATE TABLE IF NOT EXISTS akin_profile (
      id TEXT PRIMARY KEY,
      name TEXT,
      house TEXT,
      age INTEGER,
      characteristics_json TEXT,
      arts_json TEXT,
      spells TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS akin_abilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value INTEGER NOT NULL,
      specialty TEXT
    );
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS akin_virtues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      is_major INTEGER NOT NULL DEFAULT 0,
      page INTEGER
    );
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS akin_flaws (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      is_major INTEGER NOT NULL DEFAULT 0,
      page INTEGER
    );
  `);
}
