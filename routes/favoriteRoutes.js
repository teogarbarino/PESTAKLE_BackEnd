const express = require('express');
const router = express.Router();
const Item = require('../models/items');
const Favorite = require('../models/favoris');
const mongoose = require('mongoose');  // Ajoute cette ligne en haut si elle manque
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
    console.log(`🔵 Tentative d'ajout d'un favori par l'utilisateur ${req.user._id}`);
    const { itemId } = req.body;

    if (!itemId) {
      console.log("🔴 Erreur : Aucun itemId fourni");
      return res.status(400).json({ error: 'L\'ID de l\'item est requis.' });
    }

    // ✅ Convertir itemId en ObjectId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log("🔴 ID d'item invalide :", itemId);
      return res.status(400).json({ error: "ID d'item invalide." });
    }
    const objectId = new mongoose.Types.ObjectId(itemId);

    console.log(`🟢 Vérification de l'existence de l'item ${objectId}`);
    const itemExists = await Item.findById(objectId);
    if (!itemExists) {
      console.log("🔴 Item introuvable :", objectId);
      return res.status(404).json({ error: 'Item introuvable.' });
    }

    console.log(`🟢 Vérification si l'item ${objectId} est déjà en favori`);
    const existingFavorite = await Favorite.findOne({ user: req.user._id, item: objectId });
    if (existingFavorite) {
      console.log(`🔴 L'item ${objectId} est déjà en favori`);
      return res.status(400).json({ error: 'Cet item est déjà en favori.' });
    }

    console.log(`✅ Ajout du favori pour l'utilisateur ${req.user._id}`);
    const favorite = await Favorite.create({ user: req.user._id, item: objectId });

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
