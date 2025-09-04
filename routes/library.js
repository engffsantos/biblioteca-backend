// routes/library.js — CRUD de itens da biblioteca
import express from 'express';
import { exec } from '../db.js';
import { randomUUID } from 'crypto';

const router = express.Router();

function opt(v) {
    return v === undefined ? null : v;
}

function validateCreate(body) {
    const errors = [];
    if (!body?.type)  errors.push('type é obrigatório');
    if (!body?.title) errors.push('title é obrigatório');
    return errors;
}

/** GET /api/library - lista itens */
router.get('/', async (_req, res) => {
    try {
        const result = await exec(
            'SELECT * FROM library_items ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar itens:', error);
        res.status(500).json({ error: 'Erro ao listar itens' });
    }
});

/** GET /api/library/:id - item por id */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await exec(
            'SELECT * FROM library_items WHERE id = ?',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar item:', error);
        res.status(500).json({ error: 'Erro ao buscar item' });
    }
});

/** POST /api/library - cria item */
router.post('/', async (req, res) => {
    try {
        const problems = validateCreate(req.body);
        if (problems.length) {
            return res.status(400).json({ error: 'Payload inválido', details: problems });
        }

        const id = `item-${randomUUID()}`;
        const {
            type, title, author, ability, level, quality, category, description,
        } = req.body;

        await exec(`
            INSERT INTO library_items
            (id, type, title, author, ability, level, quality, category, description)
            VALUES (?,  ?,    ?,     ?,     ?,      ?,     ?,       ?,        ?)
        `, [
            id, type, title,
            opt(author), opt(ability), opt(level), opt(quality),
            opt(category), opt(description),
        ]);

        const created = await exec('SELECT * FROM library_items WHERE id = ?', [id]);
        res.status(201).json(created.rows[0]);
    } catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({ error: 'Erro ao criar item' });
    }
});

/** PUT /api/library/:id - atualiza item */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            type, title, author, ability, level, quality, category, description,
        } = req.body;

        await exec(`
            UPDATE library_items
            SET type = COALESCE(?, type),
                title = COALESCE(?, title),
                author = ?,
                ability = ?,
                level = ?,
                quality = ?,
                category = ?,
                description = ?
            WHERE id = ?
        `, [
            type ?? null, title ?? null,
            opt(author), opt(ability), opt(level), opt(quality),
            opt(category), opt(description),
            id,
        ]);

        const updated = await exec('SELECT * FROM library_items WHERE id = ?', [id]);
        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        res.json(updated.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({ error: 'Erro ao atualizar item' });
    }
});

/** DELETE /api/library/:id - remove item */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await exec('DELETE FROM library_items WHERE id = ?', [id]);
        res.status(204).end();
    } catch (error) {
        console.error('Erro ao excluir item:', error);
        res.status(500).json({ error: 'Erro ao excluir item' });
    }
});

export default router;
