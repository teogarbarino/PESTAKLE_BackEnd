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

router.get('/estimate-price', async (req, res) => {
  try {
    const { category, brand, size } = req.query; // Récupération des filtres

    if (!category) {
      return res.status(400).json({ error: "La catégorie est requise pour l'estimation." });
    }

    // Filtrage des articles similaires
    const filter = { category };
    if (brand) filter.brand = brand;
    if (size) filter.size = size;

    const items = await Item.find(filter, { price: 1 }).sort({ price: 1 }); // Trie par prix

    if (items.length < 5) {
      return res.status(400).json({ error: "Pas assez de données pour estimer un prix." });
    }

    // Extraire les prix triés
    let prices = items.map(item => item.price);

    // 📌 Calcul des quartiles (Q1, Q3) et de l'Intervalle Interquartile (IQR)
    const Q1 = prices[Math.floor(prices.length * 0.25)];
    const Q3 = prices[Math.floor(prices.length * 0.75)];
    const IQR = Q3 - Q1;
    const minAllowed = Q1 - 1.5 * IQR;
    const maxAllowed = Q3 + 1.5 * IQR;

    // Filtrer les prix en enlevant les outliers
    prices = prices.filter(price => price >= minAllowed && price <= maxAllowed);

    if (prices.length < 3) {
      return res.status(400).json({ error: "Trop de valeurs extrêmes, estimation impossible." });
    }

    // 📌 Recalcul de la moyenne et de l'écart-type sans outliers
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // 📌 Définition de la fourchette de prix (Moyenne ± 1 écart-type)
    const minPrice = Math.max(0, Math.round(mean - stdDev));
    const maxPrice = Math.round(mean + stdDev);

    res.status(200).json({
      estimatedPrice: Math.round(mean),
      priceRange: { min: minPrice, max: maxPrice },
      analyzedItems: prices.length // Nombre d'articles après filtrage
    });

  } catch (error) {
    console.error("❌ Erreur dans GET /items/estimate-price:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

module.exports = router;
