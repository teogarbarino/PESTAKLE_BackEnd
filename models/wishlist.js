const mongoose = require('mongoose');
const { nanoid } = require('nanoid'); // Pour générer un code de partage unique

// Sous-schéma pour chaque élément de la wishlist
const WishlistItemSchema = new mongoose.Schema({
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true }, // Référence à l'article
    isValidated: { type: Boolean, default: false }, // Validation de l'article
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } // Utilisateur qui a validé
});

// Schéma principal de la wishlist
const WishlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Propriétaire
    title: { type: String, required: true }, // Titre de la wishlist
    description: { type: String, default: '' }, // Description de la wishlist
    photo: { type: String, default: null }, // Image de la wishlist
    code: { type: String, unique: true, default: () => nanoid(10) }, // Code unique de partage
    items: [WishlistItemSchema], // Articles ajoutés
    createdAt: { type: Date, default: Date.now }, // Date de création
    updatedAt: { type: Date, default: Date.now } // Date de mise à jour
});

// Middleware pour mettre à jour `updatedAt` lors des sauvegardes
WishlistSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Wishlist = mongoose.model('Wishlist', WishlistSchema);

module.exports = Wishlist;
