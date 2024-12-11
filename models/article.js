const mongoose = require('mongoose');

// Schéma du modèle Article
const ItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Référence au modèle User
  photos: [{ type: String, default: [] }], // Liste de photos (par défaut vide)
  brand: { type: String, default: '' }, // Marque (optionnel)
  size: { type: String, default: '' }, // Taille (optionnel)
  materials: { type: String, default: '' }, // Matériaux (optionnel)
  colors: { type: String, default: '' }, // Couleurs (optionnel)
  price: { type: Number, required: true }, // Prix (requis)
  recommendedPrice: { type: Number, default: null }, // Prix recommandé (optionnel)
  category: { 
    type: String, 
    enum: ['clothing', 'toy', 'accessory'], 
    required: true 
  }, // Catégorie (requis, avec valeurs limitées)
  description: { type: String, default: '' }, // Description (optionnel)
  reports: { type: Number, default: 0 }, // Nombre de signalements
  status: { 
    type: String, 
    enum: ['active', 'flagged', 'deleted'], 
    default: 'active' 
  }, // Statut de l'article
  createdAt: { type: Date, default: Date.now }, // Date de création
  updatedAt: { type: Date, default: Date.now } // Date de mise à jour
});

// Middleware : Avant de supprimer un article
ItemSchema.pre('remove', async function (next) {
  const itemId = this._id;4
  *4
  *ù4
  **23
  try {
    // Suppression des favoris associés à cet article
    await Favorite.deleteMany({ item: itemId });

    // Suppression des transactions associées à cet article
    await Transaction.deleteMany({ item: itemId });

    next();
  } catch (err) {
    next(err); // Passe l'erreur au gestionnaire d'erreurs Express
  }
});

// Création du modèle
const Item = mongoose.model('Item', ItemSchema);

module.exports = Item;
