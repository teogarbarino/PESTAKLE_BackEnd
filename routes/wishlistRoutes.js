const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Wishlist = require('../models/wishlist');
const Item = require('../models/items');
const authMiddleware = require('../middleware/authMiddleware');

// 📌 **Créer une wishlist**
router.post('/', authMiddleware, async (req, res) => {
    try {
        console.log(`🔵 Création d'une wishlist par l'utilisateur ${req.user._id}`);
        const { title, description, photo } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Le titre de la wishlist est requis." });
        }

        const wishlist = new Wishlist({
            user: req.user._id,
            title,
            description: description || '',
            photo: photo || null,
            items: []
        });

        await wishlist.save();
        console.log(`✅ Wishlist créée avec succès : ${wishlist._id}`);

        res.status(201).json(wishlist);
    } catch (error) {
        console.error("❌ Erreur dans POST /wishlist :", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

// 📌 **Obtenir toutes les wishlists de l'utilisateur**
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log(`🔵 Récupération des wishlists de l'utilisateur ${req.user._id}`);

        const wishlists = await Wishlist.find({ user: req.user._id }).populate('items.item');
        res.status(200).json(wishlists);
    } catch (error) {
        console.error("❌ Erreur dans GET /wishlist :", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

// 📌 **Ajouter un article à une wishlist**
router.post('/:wishlistId/items', authMiddleware, async (req, res) => {
    try {
        const { wishlistId } = req.params;
        const { itemId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(wishlistId) || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ error: "ID de wishlist ou d'article invalide." });
        }

        const wishlist = await Wishlist.findById(wishlistId);
        if (!wishlist || wishlist.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Accès interdit ou wishlist introuvable." });
        }

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ error: "Article introuvable." });
        }

        wishlist.items.push({ item: itemId });
        await wishlist.save();

        console.log(`✅ Article ${itemId} ajouté à la wishlist ${wishlistId}`);
        res.status(200).json(wishlist);
    } catch (error) {
        console.error("❌ Erreur dans POST /wishlist/:wishlistId/items :", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

// 📌 **Réserver un article**
router.put('/:wishlistId/reserve/:itemId', authMiddleware, async (req, res) => {
    try {
        const { wishlistId, itemId } = req.params;

        const wishlist = await Wishlist.findById(wishlistId);
        if (!wishlist) {
            return res.status(404).json({ error: "Wishlist introuvable." });
        }

        const itemIndex = wishlist.items.findIndex(i => i.item.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: "Article non trouvé dans la wishlist." });
        }

        if (wishlist.items[itemIndex].isValidated) {
            return res.status(400).json({ error: "Cet article est déjà réservé ou validé." });
        }

        wishlist.items[itemIndex].isValidated = true;
        wishlist.items[itemIndex].validatedBy = req.user._id;

        await wishlist.save();
        res.status(200).json(wishlist);
    } catch (error) {
        console.error("❌ Erreur dans PUT /wishlist/:wishlistId/reserve/:itemId :", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

// 📌 **Générer un lien de partage (Deep Linking)**
router.get('/share/:wishlistId', async (req, res) => {
    try {
        const { wishlistId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(wishlistId)) {
            return res.status(400).json({ error: "ID de wishlist invalide." });
        }

        const wishlist = await Wishlist.findById(wishlistId);
        if (!wishlist) {
            return res.status(404).json({ error: "Wishlist introuvable." });
        }

        const deepLink = `https://myapp.com/wishlist/${wishlist.code}`;

        res.status(200).json({ link: deepLink, wishlist });
    } catch (error) {
        console.error("❌ Erreur dans GET /wishlist/share/:wishlistId :", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

// 📌 **Rejoindre une wishlist avec un code de partage**
router.post('/join/:code', authMiddleware, async (req, res) => {
    try {
        const { code } = req.params;

        const wishlist = await Wishlist.findOne({ code });
        if (!wishlist) {
            return res.status(404).json({ error: "Code de partage invalide." });
        }

        res.status(200).json(wishlist);
    } catch (error) {
        console.error("❌ Erreur dans POST /wishlist/join/:code :", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

module.exports = router;