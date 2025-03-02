const express = require('express');
const router = express.Router();
const Item = require('../models/items');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const itemOwnershipMiddleware = require('../middleware/itemMiddleware');
const Report = require('../models/reports');

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

router.put('/protect/:itemId', authMiddleware, async (req, res) => {
  try {
    console.log(`🔵 Protection de l'article ${req.params.itemId} par l'utilisateur ${req.user._id}`);

    const item = await Item.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ error: "Article non trouvé." });
    }

    // Vérifier si l'utilisateur est admin ou propriétaire
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Accès refusé. Seuls les administrateurs peuvent protéger un article." });
    }

    // Mettre à jour le statut de l'article en `protected`
    item.status = "protected";
    await item.save();

    console.log(`✅ Article ${item._id} protégé avec succès.`);
    res.status(200).json({
      message: "L'article a été protégé contre les signalements abusifs.",
      item
    });

  } catch (error) {
    console.error("❌ Erreur dans PUT /items/protect/:itemId:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

router.post('/report/:itemId', authMiddleware, async (req, res) => {
  try {
    console.log("🔵 Requête reçue sur /items/report/:itemId");

    const { reason } = req.body;
    const userId = req.user._id;
    const itemId = req.params.itemId;

    console.log("🟢 Paramètres reçus :", { userId, itemId, reason });

    // Vérifier si l'ID de l'article est valide
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log("🔴 ID article invalide :", itemId);
      return res.status(400).json({ error: "ID de l'article invalide." });
    }

    // Vérifier si l'article existe
    const item = await Item.findById(itemId);
    if (!item) {
      console.log("🔴 Article non trouvé :", itemId);
      return res.status(404).json({ error: "Article non trouvé." });
    }

    console.log("🟢 Article trouvé en base :", item._id);

    // Empêcher un utilisateur de signaler son propre article
    if (item.user.toString() === userId.toString()) {
      console.log("🔴 Tentative de signalement de son propre article par :", userId);
      return res.status(403).json({ error: "Vous ne pouvez pas signaler votre propre article." });
    }

    // Vérifier si l'utilisateur a déjà signalé cet article
    const existingReport = await Report.findOne({ item: itemId, reportedBy: userId });
    if (existingReport) {
      console.log("🔴 L'utilisateur a déjà signalé cet article :", { userId, itemId });
      return res.status(400).json({ error: "Vous avez déjà signalé cet article." });
    }

    // Enregistrer le signalement
    const newReport = await Report.create({
      item: itemId,
      reportedBy: userId,
      reason
    });

    console.log("✅ Signalement enregistré avec succès :", newReport._id);

    // Incrémenter le nombre de signalements sur l'article
    item.reports += 1;

    // Si l'article atteint 5 signalements et n'est pas `protected`, on le flag automatiquement
    if (item.reports >= 5 && item.status !== "protected") {
      item.status = "flagged";
      console.log("🚨 L'article a été flaggé automatiquement :", itemId);
    }

    await item.save();
    console.log("✅ Mise à jour du nombre de reports de l'article :", item.reports);

    res.status(200).json({
      message: "Article signalé avec succès.",
      item: {
        id: item._id,
        reports: item.reports,
        status: item.status
      }
    });

  } catch (error) {
    console.error("❌ ERREUR dans POST /items/report/:itemId:", error);
    res.status(500).json({ error: `Erreur interne du serveur : ${error.message}` });
  }
});


router.get('/reports/:itemId', authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.itemId;

    // Vérifier si l'ID de l'article est valide
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "ID de l'article invalide." });
    }

    // Vérifier si l'article existe
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Article non trouvé." });
    }

    // Récupérer tous les reports de cet article
    const reports = await Report.find({ item: itemId }).populate('reportedBy', 'username email');

    res.status(200).json({
      itemId: item._id,
      totalReports: reports.length,
      reports
    });

  } catch (error) {
    console.error("❌ Erreur dans GET /items/reports/:itemId:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});


module.exports = router;
