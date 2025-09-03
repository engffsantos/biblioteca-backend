// routes/akin.js
import express from 'express';
import { db } from '../db.js';
import { randomUUID } from 'crypto';

const router = express.Router();

/**
 * Helper: carrega o "estado" completo do AKIN (perfil + arrays)
 */
async function loadAkin() {
  const [profileRes, abilitiesRes, virtuesRes, flawsRes] = await Promise.all([
    db.execute({ sql: 'SELECT * FROM akin_profile WHERE id = ?', args: ['akin'] }),
    db.execute('SELECT * FROM akin_abilities ORDER BY name ASC'),
    db.execute('SELECT * FROM akin_virtues ORDER BY name ASC'),
    db.execute('SELECT * FROM akin_flaws ORDER BY name ASC'),
  ]);

  const profileRow = profileRes.rows[0] || null;

  // Reconstrói o objeto com JSON parse seguro
  const characteristics =
      profileRow?.characteristics_json ? safeJson(profileRow.characteristics_json) : null;
  const arts = profileRow?.arts_json ? safeJson(profileRow.arts_json) : null;

  return {
    profile: profileRow
        ? {
          id: profileRow.id,
          name: profileRow.name || '',
          house: profileRow.house || '',
          age: profileRow.age ?? null,
          characteristics: characteristics || {
            int: 0, per: 0, str: 0, sta: 0, pre: 0, com: 0, dex: 0, qik: 0,
          },
          arts: arts || {
            creo: 0, intellego: 0, muto: 0, perdo: 0, rego: 0,
            animal: 0, aquam: 0, auram: 0, corpus: 0, herbam: 0,
            ignem: 0, imaginem: 0, mentem: 0, terram: 0, vim: 0,
          },
          spells: profileRow.spells || '',
          notes: profileRow.notes || '',
          created_at: profileRow.created_at,
          updated_at: profileRow.updated_at,
        }
        : null,
    abilities: abilitiesRes.rows,
    virtues: virtuesRes.rows.map(v => ({ ...v, is_major: !!v.is_major })),
    flaws: flawsRes.rows.map(f => ({ ...f, is_major: !!f.is_major })),
  };
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * GET /api/akin
 * Retorna todo o estado do AKIN (perfil + habilidades + virtudes + falhas)
 */
router.get('/', async (_req, res) => {
  try {
    const data = await loadAkin();
    res.json(data);
  } catch (error) {
    console.error('Erro ao obter AKIN:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/akin
 * Upsert do perfil do AKIN
 * body: { name, house, age, characteristics, arts, spells, notes }
 */
router.put('/', async (req, res) => {
  try {
    const {
      name = '',
      house = '',
      age = null,
      characteristics = null,
      arts = null,
      spells = '',
      notes = '',
    } = req.body || {};

    const now = new Date().toISOString();

    // UPSERT
    await db.execute({
      sql: `
        INSERT INTO akin_profile (id, name, house, age, characteristics_json, arts_json, spells, notes, created_at, updated_at)
        VALUES ('akin', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          house=excluded.house,
          age=excluded.age,
          characteristics_json=excluded.characteristics_json,
          arts_json=excluded.arts_json,
          spells=excluded.spells,
          notes=excluded.notes,
          updated_at=excluded.updated_at
      `,
      args: [
        name,
        house,
        age,
        characteristics ? JSON.stringify(characteristics) : null,
        arts ? JSON.stringify(arts) : null,
        spells,
        notes,
        now,
        now,
      ],
    });

    const data = await loadAkin();
    res.json(data.profile);
  } catch (error) {
    console.error('Erro ao atualizar perfil AKIN:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/akin/abilities
 * body: { name, value, specialty? }
 */
router.post('/abilities', async (req, res) => {
  try {
    const { name, value, specialty = null } = req.body || {};
    if (!name || value === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, value' });
    }
    const id = `abil-${randomUUID()}`;
    await db.execute({
      sql: `INSERT INTO akin_abilities (id, name, value, specialty) VALUES (?, ?, ?, ?)`,
      args: [id, name, value, specialty],
    });
    const created = await db.execute({ sql: 'SELECT * FROM akin_abilities WHERE id=?', args: [id] });
    res.status(201).json(created.rows[0]);
  } catch (error) {
    console.error('Erro ao criar habilidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/akin/abilities/:id
 */
router.put('/abilities/:id', async (req, res) => {
  try {
    const { name, value, specialty = null } = req.body || {};
    const { id } = req.params;

    const exists = await db.execute({ sql: 'SELECT id FROM akin_abilities WHERE id=?', args: [id] });
    if (exists.rows.length === 0) return res.status(404).json({ error: 'Habilidade não encontrada' });

    await db.execute({
      sql: `UPDATE akin_abilities SET name=?, value=?, specialty=? WHERE id=?`,
      args: [name, value, specialty, id],
    });
    const updated = await db.execute({ sql: 'SELECT * FROM akin_abilities WHERE id=?', args: [id] });
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar habilidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/akin/abilities/:id
 */
router.delete('/abilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM akin_abilities WHERE id=?', args: [id] });
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao deletar habilidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/akin/virtues
 * body: { name, description, is_major?, page? }
 */
router.post('/virtues', async (req, res) => {
  try {
    const { name, description, is_major = false, page = null } = req.body || {};
    if (!name || !description) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, description' });
    }
    const id = `virt-${randomUUID()}`;
    await db.execute({
      sql: `INSERT INTO akin_virtues (id, name, description, is_major, page) VALUES (?, ?, ?, ?, ?)`,
      args: [id, name, description, is_major ? 1 : 0, page],
    });
    const created = await db.execute({ sql: 'SELECT * FROM akin_virtues WHERE id=?', args: [id] });
    const row = created.rows[0];
    res.status(201).json({ ...row, is_major: !!row.is_major });
  } catch (error) {
    console.error('Erro ao criar virtude:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/akin/virtues/:id
 */
router.put('/virtues/:id', async (req, res) => {
  try {
    const { name, description, is_major = false, page = null } = req.body || {};
    const { id } = req.params;

    const exists = await db.execute({ sql: 'SELECT id FROM akin_virtues WHERE id=?', args: [id] });
    if (exists.rows.length === 0) return res.status(404).json({ error: 'Virtude não encontrada' });

    await db.execute({
      sql: `UPDATE akin_virtues SET name=?, description=?, is_major=?, page=? WHERE id=?`,
      args: [name, description, is_major ? 1 : 0, page, id],
    });
    const updated = await db.execute({ sql: 'SELECT * FROM akin_virtues WHERE id=?', args: [id] });
    const row = updated.rows[0];
    res.json({ ...row, is_major: !!row.is_major });
  } catch (error) {
    console.error('Erro ao atualizar virtude:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/akin/virtues/:id
 */
router.delete('/virtues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM akin_virtues WHERE id=?', args: [id] });
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao deletar virtude:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/akin/flaws
 * body: { name, description, is_major?, page? }
 */
router.post('/flaws', async (req, res) => {
  try {
    const { name, description, is_major = false, page = null } = req.body || {};
    if (!name || !description) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, description' });
    }
    const id = `flaw-${randomUUID()}`;
    await db.execute({
      sql: `INSERT INTO akin_flaws (id, name, description, is_major, page) VALUES (?, ?, ?, ?, ?)`,
      args: [id, name, description, is_major ? 1 : 0, page],
    });
    const created = await db.execute({ sql: 'SELECT * FROM akin_flaws WHERE id=?', args: [id] });
    const row = created.rows[0];
    res.status(201).json({ ...row, is_major: !!row.is_major });
  } catch (error) {
    console.error('Erro ao criar falha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/akin/flaws/:id
 */
router.put('/flaws/:id', async (req, res) => {
  try {
    const { name, description, is_major = false, page = null } = req.body || {};
    const { id } = req.params;

    const exists = await db.execute({ sql: 'SELECT id FROM akin_flaws WHERE id=?', args: [id] });
    if (exists.rows.length === 0) return res.status(404).json({ error: 'Falha não encontrada' });

    await db.execute({
      sql: `UPDATE akin_flaws SET name=?, description=?, is_major=?, page=? WHERE id=?`,
      args: [name, description, is_major ? 1 : 0, page, id],
    });
    const updated = await db.execute({ sql: 'SELECT * FROM akin_flaws WHERE id=?', args: [id] });
    const row = updated.rows[0];
    res.json({ ...row, is_major: !!row.is_major });
  } catch (error) {
    console.error('Erro ao atualizar falha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/akin/flaws/:id
 */
router.delete('/flaws/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM akin_flaws WHERE id=?', args: [id] });
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao deletar falha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
