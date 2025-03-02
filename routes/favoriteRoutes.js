const express = require('express');
const router = express.Router();
const Item = require('../models/items');
const Favorite = require('../models/favoris');
const Item = require('../models/Item');
const authMiddleware = require('../middleware/authMiddleware');

// 📌 **Obtenir tous les favoris de l'utilisateur connecté**
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log(`🔵 Récupération des favoris de l'utilisateur ${req.user._id}`);
    const favorites = await Favorite.find({ user: req.user._id }).populate('item');
    res.status(200).json(favorites);
  } catch (error) {
    console.error('❌ Erreur dans GET /favorites:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// 📌 **Ajouter un favori**
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'L\'ID de l\'item est requis.' });
    }

    // Vérifier si l'item existe
    const itemExists = await Item.findById(itemId);
    if (!itemExists) {
      return res.status(404).json({ error: 'Item introuvable.' });
    }

    // Vérifier si l'item est déjà en favori
    const existingFavorite = await Favorite.findOne({ user: req.user._id, item: itemId });
    if (existingFavorite) {
      return res.status(400).json({ error: 'Cet item est déjà en favori.' });
    }

    // Ajouter le favori
    const favorite = await Favorite.create({ user: req.user._id, item: itemId });
    console.log(`✅ Favori ajouté pour l'utilisateur ${req.user._id}`);
    res.status(201).json(favorite);

  } catch (error) {
    console.error('❌ Erreur dans POST /favorites:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// 📌 **Supprimer un favori**
router.delete('/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Vérifier si le favori existe
    const favorite = await Favorite.findOneAndDelete({ user: req.user._id, item: itemId });
    if (!favorite) {
      return res.status(404).json({ error: 'Ce favori n\'existe pas.' });
    }

    console.log(`✅ Favori supprimé pour l'item ${itemId}`);
    res.status(200).json({ message: 'Favori supprimé avec succès.' });

  } catch (error) {
    console.error('❌ Erreur dans DELETE /favorites/:itemId:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

module.exports = router;
