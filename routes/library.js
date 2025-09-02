import express from 'express';
import { initialData, ItemType, LabTextCategory } from '../data/initialData.js';

const router = express.Router();

// Simulando um banco de dados em memória
let database = JSON.parse(JSON.stringify(initialData));

// GET /api/library - Listar todos os itens da biblioteca
router.get('/', (req, res) => {
  try {
    res.json(database.library);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/library/:id - Obter um item específico
router.get('/:id', (req, res) => {
  try {
    const item = database.library.find(item => item.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/library - Criar um novo item
router.post('/', (req, res) => {
  try {
    const newItem = {
      id: `item-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validação básica
    if (!newItem.title || !newItem.author || !newItem.type) {
      return res.status(400).json({ error: 'Campos obrigatórios: title, author, type' });
    }

    database.library.push(newItem);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/library/:id - Atualizar um item existente
router.put('/:id', (req, res) => {
  try {
    const itemIndex = database.library.findIndex(item => item.id === req.params.id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const updatedItem = {
      ...database.library[itemIndex],
      ...req.body,
      id: req.params.id, // Garantir que o ID não seja alterado
      updatedAt: new Date().toISOString(),
    };

    database.library[itemIndex] = updatedItem;
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/library/:id - Deletar um item
router.delete('/:id', (req, res) => {
  try {
    const itemIndex = database.library.findIndex(item => item.id === req.params.id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    database.library.splice(itemIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

