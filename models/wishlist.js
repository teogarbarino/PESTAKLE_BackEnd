const mongoose = require('mongoose');

// Sous-schéma pour chaque élément de la wishlist
const WishlistItemSchema = new mongoose.Schema({
    // Référence à l'article
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    // Indique si l'article a été validé (par exemple, par un autre utilisateur)
    isValidated: {
        type: Boolean,
        default: false
    },
    // Référence à l'utilisateur qui a validé l'article (optionnel)
    validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
});

// Schéma principal de la wishlist
const WishlistSchema = new mongoose.Schema({
    // Référence à l'utilisateur propriétaire de la wishlist
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Titre de la wishlist
    title: {
        type: String,
        required: true
    },
    // Tableau d'éléments de la wishlist (chaque élément contient l'article, l'état de validation, etc.)
    items: [WishlistItemSchema],
    // Date de création de la wishlist
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Date de dernière modification
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware pour mettre à jour updatedAt lors des sauvegardes
WishlistSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Création du modèle Wishlist
const Wishlist = mongoose.model('Wishlist', WishlistSchema);

module.exports = Wishlist;
