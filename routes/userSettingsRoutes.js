const express = require('express');
const router = express.Router();
const UserSettings = require('../models/userSettings');
const authMiddleware = require('../middleware/authMiddleware');

// Obtenir les paramètres de l'utilisateur connecté
router.get('/', authMiddleware, async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ user: req.user._id });
    if (!settings) {
      return res.status(404).json({ error: 'Paramètres introuvables.' });
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error('Erreur dans GET /settings:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Mettre à jour les paramètres de l'utilisateur
router.put('/', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true }
    );
    res.status(200).json(settings);
  } catch (error) {
    console.error('Erreur dans PUT /settings:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

module.exports = router;
