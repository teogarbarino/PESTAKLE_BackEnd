const mongoose = require('mongoose');

// Schéma des paramètres utilisateur
const UserSettingsSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, // Référence obligatoire à l'utilisateur
    unique: true // Chaque utilisateur doit avoir un seul ensemble de paramètres
  },
  theme: { 
    type: String, 
    enum: ['light', 'dark'], // Restreint à deux thèmes possibles
    default: 'light' // Valeur par défaut
  },
  fontSize: { 
    type: Number, 
    default: 16, // Taille de police par défaut
    min: 12, // Taille minimale
    max: 24 // Taille maximale pour éviter des tailles démesurées
  },
  contrast: { 
    type: String, 
    enum: ['normal', 'high'], // Deux niveaux de contraste
    default: 'normal' // Valeur par défaut
  },
  updatedAt: { 
    type: Date, 
    default: Date.now // Date de dernière mise à jour
  }
});

// Middleware : Avant de sauvegarder, mettre à jour `updatedAt`
UserSettingsSchema.pre('save', function (next) {
  this.updatedAt = Date.now(); // Met à jour la date à chaque sauvegarde
  next();
});

// Création du modèle
const UserSettings = mongoose.model('UserSettings', UserSettingsSchema);

module.exports = UserSettings;
