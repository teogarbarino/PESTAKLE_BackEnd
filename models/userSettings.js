const mongoose = require('mongoose');

// Schéma des paramètres utilisateur
const UserSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  fontSize: {
    type: Number,
    default: 16,
    min: 12,
    max: 24
  },
  updatedAt: {
    type: Date,
    default: Date.now
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
