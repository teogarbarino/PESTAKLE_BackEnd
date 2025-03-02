const express = require('express');
const router = express.Router();
const Item = require('../models/items');
const Favorite = require('../models/favoris');
const mongoose = require('mongoose'); // Assure-toi que Mongoose est bien importé
const authMiddleware = require('../middleware/authMiddleware');

// 📌 **Obtenir tous les favoris de l'utilisateur connecté**
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log(`🔵 Récupération des favoris de l'utilisateur ${req.user._id}`);

    const favorites = await Favorite.find({ user: req.user._id }).populate('item');

    console.log(`✅ Nombre de favoris trouvés : ${favorites.length}`);
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

    // Récupération de l'itemId depuis le body et nettoyage
    const itemId = String(req.body.itemId).trim();
    console.log("🛠️ ID reçu après nettoyage :", itemId);

    if (!itemId) {
      console.log("🔴 Erreur : Aucun itemId fourni");
      return res.status(400).json({ error: "L'ID de l'item est requis." });
    }

    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log("🔴 ID d'item invalide :", itemId);
      return res.status(400).json({ error: "ID d'item invalide." });
    }

    console.log(`🟢 Vérification de l'existence de l'item ${itemId}`);
    const itemExists = await Item.findById(itemId);
    if (!itemExists) {
      console.log("🔴 Item introuvable :", itemId);
      return res.status(404).json({ error: "Item introuvable." });
    }

    console.log(`🟢 Vérification si l'item ${itemId} est déjà en favori`);
    const existingFavorite = await Favorite.findOne({ user: req.user._id, item: itemId });
    if (existingFavorite) {
      console.log(`🔴 L'item ${itemId} est déjà en favori`);
      return res.status(400).json({ error: "Cet item est déjà en favori." });
    }

    console.log(`✅ Ajout du favori pour l'utilisateur ${req.user._id}`);
    const favorite = await Favorite.create({ user: req.user._id, item: itemId });

    res.status(201).json(favorite);
  } catch (error) {
    console.error('❌ Erreur dans POST /favorites:', error);
    res.status(500).json({ error: "Erreur interne." });
  }
});

// 📌 **Supprimer un favori**
router.delete('/:itemId', authMiddleware, async (req, res) => {
  try {
    const itemId = String(req.params.itemId).trim();
    console.log(`🔵 Tentative de suppression du favori pour l'item ${itemId} par ${req.user._id}`);

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log("🔴 ID d'item invalide :", itemId);
      return res.status(400).json({ error: "ID d'item invalide." });
    }

    const favorite = await Favorite.findOneAndDelete({ user: req.user._id, item: itemId });
    if (!favorite) {
      console.log(`🔴 Favori introuvable pour l'item ${itemId}`);
      return res.status(404).json({ error: "Ce favori n'existe pas." });
    }

    console.log(`✅ Favori supprimé pour l'item ${itemId}`);
    res.status(200).json({ message: "Favori supprimé avec succès." });

  } catch (error) {
    console.error('❌ Erreur dans DELETE /favorites/:itemId:', error);
    res.status(500).json({ error: "Erreur interne." });
  }
});

module.exports = router;
