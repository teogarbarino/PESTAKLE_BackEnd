const express = require('express');
const router = express.Router();
const Item = require('../models/Article');
const authMiddleware = require('../middleware/authMiddleware');
const itemOwnershipMiddleware = require('../middleware/itemMiddleware');

// Obtenir tous les articles
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json(items);
  } catch (error) {
    console.error('Erreur dans GET /items:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Créer un nouvel article
router.post('/', authMiddleware, async (req, res) => {
  try {
    const item = await Item.create({ ...req.body, user: req.user._id });
    res.status(201).json(item);
  } catch (error) {
    console.error('Erreur dans POST /items:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Mettre à jour un article
router.put('/:itemId', authMiddleware, itemOwnershipMiddleware, async (req, res) => {
  try {
    Object.assign(req.item, req.body);
    await req.item.save();
    res.status(200).json(req.item);
  } catch (error) {
    console.error('Erreur dans PUT /items/:itemId:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Supprimer un article
router.delete('/:itemId', authMiddleware, itemOwnershipMiddleware, async (req, res) => {
  try {
    await req.item.remove();
    res.status(200).json({ message: 'Article supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur dans DELETE /items/:itemId:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

module.exports = router;
