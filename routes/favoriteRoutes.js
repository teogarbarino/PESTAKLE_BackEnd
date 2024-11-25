const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favoris');
const authMiddleware = require('../middleware/authMiddleware');

// Obtenir tous les favoris de l'utilisateur connecté
router.get('/', authMiddleware, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate('item');
    res.status(200).json(favorites);
  } catch (error) {
    console.error('Erreur dans GET /favorites:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Ajouter un favori
router.post('/', authMiddleware, async (req, res) => {
  try {
    const favorite = await Favorite.create({ ...req.body, user: req.user._id });
    res.status(201).json(favorite);
  } catch (error) {
    console.error('Erreur dans POST /favorites:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Supprimer un favori
router.delete('/:favoriteId', authMiddleware, async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({ _id: req.params.favoriteId, user: req.user._id });
    if (!favorite) {
      return res.status(404).json({ error: 'Favori introuvable.' });
    }
    res.status(200).json({ message: 'Favori supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur dans DELETE /favorites/:favoriteId:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

module.exports = router;
