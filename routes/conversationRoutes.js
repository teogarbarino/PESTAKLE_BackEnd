const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Conversation = require('../models/Conversation');

// Obtenir toutes les conversations de l'utilisateur connecté
router.get('/', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({ users: req.user._id });
    res.status(200).json(conversations);
  } catch (error) {
    console.error('Erreur dans GET /conversations:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Créer une nouvelle conversation
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { users } = req.body;

    // Ajouter l'utilisateur connecté automatiquement
    const conversation = await Conversation.create({
      users: [req.user._id, ...users],
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Erreur dans POST /conversations:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Supprimer une conversation
router.delete('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.conversationId,
      users: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation introuvable.' });
    }

    res.status(200).json({ message: 'Conversation supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur dans DELETE /conversations/:conversationId:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

module.exports = router;
