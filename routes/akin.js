import express from 'express';
import { initialData } from '../data/initialData.js';

const router = express.Router();

// Simulando um banco de dados em memória
let database = JSON.parse(JSON.stringify(initialData));

// GET /api/akin - Obter dados do personagem Akin
router.get('/', (req, res) => {
  try {
    res.json(database.akin);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/akin - Atualizar dados do personagem Akin
router.put('/', (req, res) => {
  try {
    database.akin = {
      ...database.akin,
      ...req.body,
    };
    res.json(database.akin);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/akin/abilities - Adicionar nova habilidade
router.post('/abilities', (req, res) => {
  try {
    const newAbility = {
      id: `abil-${Date.now()}`,
      ...req.body,
    };

    if (!newAbility.name || newAbility.value === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, value' });
    }

    database.akin.abilities.push(newAbility);
    res.status(201).json(newAbility);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/akin/abilities/:id - Atualizar habilidade
router.put('/abilities/:id', (req, res) => {
  try {
    const abilityIndex = database.akin.abilities.findIndex(ability => ability.id === req.params.id);
    if (abilityIndex === -1) {
      return res.status(404).json({ error: 'Habilidade não encontrada' });
    }

    database.akin.abilities[abilityIndex] = {
      ...database.akin.abilities[abilityIndex],
      ...req.body,
      id: req.params.id,
    };

    res.json(database.akin.abilities[abilityIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/akin/abilities/:id - Deletar habilidade
router.delete('/abilities/:id', (req, res) => {
  try {
    const abilityIndex = database.akin.abilities.findIndex(ability => ability.id === req.params.id);
    if (abilityIndex === -1) {
      return res.status(404).json({ error: 'Habilidade não encontrada' });
    }

    database.akin.abilities.splice(abilityIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/akin/virtues - Adicionar nova virtude
router.post('/virtues', (req, res) => {
  try {
    const newVirtue = {
      id: `virt-${Date.now()}`,
      ...req.body,
    };

    if (!newVirtue.name || !newVirtue.description) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, description' });
    }

    database.akin.virtues.push(newVirtue);
    res.status(201).json(newVirtue);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/akin/virtues/:id - Atualizar virtude
router.put('/virtues/:id', (req, res) => {
  try {
    const virtueIndex = database.akin.virtues.findIndex(virtue => virtue.id === req.params.id);
    if (virtueIndex === -1) {
      return res.status(404).json({ error: 'Virtude não encontrada' });
    }

    database.akin.virtues[virtueIndex] = {
      ...database.akin.virtues[virtueIndex],
      ...req.body,
      id: req.params.id,
    };

    res.json(database.akin.virtues[virtueIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/akin/virtues/:id - Deletar virtude
router.delete('/virtues/:id', (req, res) => {
  try {
    const virtueIndex = database.akin.virtues.findIndex(virtue => virtue.id === req.params.id);
    if (virtueIndex === -1) {
      return res.status(404).json({ error: 'Virtude não encontrada' });
    }

    database.akin.virtues.splice(virtueIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/akin/flaws - Adicionar nova falha
router.post('/flaws', (req, res) => {
  try {
    const newFlaw = {
      id: `flaw-${Date.now()}`,
      ...req.body,
    };

    if (!newFlaw.name || !newFlaw.description) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, description' });
    }

    database.akin.flaws.push(newFlaw);
    res.status(201).json(newFlaw);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/akin/flaws/:id - Atualizar falha
router.put('/flaws/:id', (req, res) => {
  try {
    const flawIndex = database.akin.flaws.findIndex(flaw => flaw.id === req.params.id);
    if (flawIndex === -1) {
      return res.status(404).json({ error: 'Falha não encontrada' });
    }

    database.akin.flaws[flawIndex] = {
      ...database.akin.flaws[flawIndex],
      ...req.body,
      id: req.params.id,
    };

    res.json(database.akin.flaws[flawIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/akin/flaws/:id - Deletar falha
router.delete('/flaws/:id', (req, res) => {
  try {
    const flawIndex = database.akin.flaws.findIndex(flaw => flaw.id === req.params.id);
    if (flawIndex === -1) {
      return res.status(404).json({ error: 'Falha não encontrada' });
    }

    database.akin.flaws.splice(flawIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

