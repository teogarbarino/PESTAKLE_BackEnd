const mongoose = require('mongoose');

// Schéma du modèle Favorite
const FavoriteSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // L'utilisateur est obligatoire
  },
  item: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item', 
    required: true // L'article est obligatoire
  },
  createdAt: { 
    type: Date, 
    default: Date.now // Date de création par défaut
  }
});

// Création du modèle
const Favorite = mongoose.model('Favorite', FavoriteSchema);

module.exports = Favorite;
