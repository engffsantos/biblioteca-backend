// biblioteca-backend/routes/library.js
import express from 'express';
import { db } from '../db.js';  // conexão com Turso
import { randomUUID } from 'crypto';

const router = express.Router();

/**
 * GET /api/library
 * Lista todos os itens da biblioteca
 */
router.get('/', async (_req, res) => {
    try {
        const result = await db.execute(
            'SELECT * FROM library_items ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar itens:', error);
        res.status(500).json({ error: 'Erro ao listar itens' });
    }
});

/**
 * GET /api/library/:id
 * Retorna um item específico pelo ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.execute({
            sql: 'SELECT * FROM library_items WHERE id = ?',
            args: [id],
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar item:', error);
        res.status(500).json({ error: 'Erro ao buscar item' });
    }
});

/**
 * POST /api/library
 * Cria um novo item na biblioteca
 */
router.post('/', async (req, res) => {
    try {
        const id = `item-${randomUUID()}`;
        const {
            type,
            title,
            author,
            ability,
            level,
            quality,
            category,
            description,
        } = req.body;

        await db.execute({
            sql: `
                INSERT INTO library_items
                (id, type, title, author, ability, level, quality, category, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
                id,
                type,
                title,
                author ?? null,
                ability ?? null,
                level ?? null,
                quality ?? null,
                category ?? null,
                description ?? null,
            ],
        });

        const created = await db.execute({
            sql: 'SELECT * FROM library_items WHERE id = ?',
            args: [id],
        });

        res.status(201).json(created.rows[0]);
    } catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({ error: 'Erro ao criar item' });
    }
});

/**
 * PUT /api/library/:id
 * Atualiza um item existente
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            type,
            title,
            author,
            ability,
            level,
            quality,
            category,
            description,
        } = req.body;

        await db.execute({
            sql: `
        UPDATE library_items
        SET type=?, title=?, author=?, ability=?, level=?, quality=?, category=?, description=?
        WHERE id=?
      `,
            args: [
                type,
                title,
                author ?? null,
                ability ?? null,
                level ?? null,
                quality ?? null,
                category ?? null,
                description ?? null,
                id,
            ],
        });

        const updated = await db.execute({
            sql: 'SELECT * FROM library_items WHERE id = ?',
            args: [id],
        });

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }

        res.json(updated.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({ error: 'Erro ao atualizar item' });
    }
});

/**
 * DELETE /api/library/:id
 * Remove um item da biblioteca
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute({
            sql: 'DELETE FROM library_items WHERE id = ?',
            args: [id],
        });

        res.status(204).end();
    } catch (error) {
        console.error('Erro ao excluir item:', error);
        res.status(500).json({ error: 'Erro ao excluir item' });
    }
});

export default router;
