const express = require('express');
const router = express.Router();
const Item = require('../models/items');
const authMiddleware = require('../middleware/authMiddleware');
const itemOwnershipMiddleware = require('../middleware/itemMiddleware');

// Obtenir tous les articles
// 📌 **Obtenir tous les articles, sauf ceux de l'utilisateur connecté**
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log(`🔵 Requête reçue sur /items par l'utilisateur ${req.user._id}`);

    // Exclure les articles de l'utilisateur connecté
    const items = await Item.find({ user: { $ne: req.user._id } });

    console.log(`✅ ${items.length} articles trouvés, hors ceux de l'utilisateur.`);
    res.status(200).json(items);
  } catch (error) {
    console.error('❌ Erreur dans GET /items:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});


// Créer un nouvel article
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log("🔵 Requête reçue sur /items");

    const { photos, brand, size, materials, colors, price, recommendedPrice, category, description, livraison, boosted } = req.body;

    // Vérifier si les champs obligatoires sont bien fournis
    if (!price || !category) {
      console.log("🔴 Champ obligatoire manquant");
      return res.status(400).json({ error: "Le prix et la catégorie sont requis." });
    }

    // Vérifier que la catégorie est valide
    const validCategories = ['clothing', 'toy', 'accessory'];
    if (!validCategories.includes(category)) {
      console.log("🔴 Catégorie invalide :", category);
      return res.status(400).json({ error: "Catégorie invalide. Choisissez parmi 'clothing', 'toy', 'accessory'." });
    }

    // Créer un nouvel article
    const item = new Item({
      user: req.user._id, // ID de l'utilisateur connecté
      photos: photos || [],
      brand: brand || '',
      size: size || '',
      materials: materials || '',
      colors: colors || '',
      price,
      recommendedPrice: recommendedPrice || null,
      category,
      description: description || '',
      reports: 0,
      status: 'active',
      livraison: livraison || false,
      boosted: boosted || false,
    });

    // Sauvegarder l'article en base
    await item.save();
    console.log("✅ Article créé avec succès :", item._id);

    res.status(201).json({
      message: "Article créé avec succès",
      item
    });

  } catch (error) {
    console.error("🔴 Erreur dans POST /items :", error);
    res.status(500).json({ error: "Erreur interne." });
  }
});

// Mettre à jour un article
router.put('/:itemId', authMiddleware, itemOwnershipMiddleware, async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.itemId, req.body, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ error: "Article non trouvé" });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Erreur dans PUT /items/:itemId:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Supprimer un article
router.delete('/:itemId', authMiddleware, itemOwnershipMiddleware, async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.itemId);
    if (!deletedItem) {
      return res.status(404).json({ error: "Article non trouvé" });
    }
  } catch (error) {
    console.error('Erreur dans DELETE /items/:itemId:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

module.exports = router;
