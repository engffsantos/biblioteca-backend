// biblioteca-backend/routes/library.js
import express from 'express';
import { db } from '../db.js';        // cliente Turso (@libsql/client)
import { randomUUID } from 'crypto';

const router = express.Router();

/* Util: normaliza campos opcionais para null (evita valores "undefined" no banco) */
function opt(v) {
    return v === undefined ? null : v;
}

/* Util: valida payload básico de um item da biblioteca */
function validatePayload(body) {
    const errors = [];
    if (!body?.type)  errors.push('type é obrigatório');
    if (!body?.title) errors.push('title é obrigatório');
    // author/ability/level/quality/category/description são opcionais
    return errors;
}

/**
 * GET /api/library
 * Lista todos os itens (ordenados pelo created_at DESC)
 * Dica: Se quiser paginação no futuro, aceite ?limit e ?offset e use LIMIT/OFFSET.
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
 * Retorna um item específico
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
 * Cria um novo item
 */
router.post('/', async (req, res) => {
    try {
        const problems = validatePayload(req.body);
        if (problems.length) {
            return res.status(400).json({ error: 'Payload inválido', details: problems });
        }

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
        VALUES (?,  ?,    ?,     ?,     ?,      ?,     ?,       ?,        ?)
      `,
            args: [
                id,
                type,
                title,
                opt(author),
                opt(ability),
                opt(level),
                opt(quality),
                opt(category),
                opt(description),
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

        // valida mínimo: se vier type/title, não podem ser vazios
        const problems = [];
        if ('type' in req.body && !req.body.type) problems.push('type não pode ser vazio');
        if ('title' in req.body && !req.body.title) problems.push('title não pode ser vazio');
        if (problems.length) {
            return res.status(400).json({ error: 'Payload inválido', details: problems });
        }

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

        // Atualiza apenas os campos enviados. Para simplificar,
        // aqui atualizamos todos, mas com opt(null) para ausentes.
        await db.execute({
            sql: `
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
      `,
            args: [
                type ?? null,            // COALESCE só se aplica a NOT NULL (type/title). Null mantém valor atual.
                title ?? null,
                opt(author),
                opt(ability),
                opt(level),
                opt(quality),
                opt(category),
                opt(description),
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
 * Remove um item
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute({
            sql: 'DELETE FROM library_items WHERE id = ?',
            args: [id],
        });

        // Mesmo se o id não existir, retornar 204 é aceitável (idempotente).
        res.status(204).end();
    } catch (error) {
        console.error('Erro ao excluir item:', error);
        res.status(500).json({ error: 'Erro ao excluir item' });
    }
});

export default router;
