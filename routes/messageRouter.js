const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Message = require('../models/Message');

// Obtenir tous les messages d'une conversation
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Erreur dans GET /messages/:conversationId:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Envoyer un message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      content,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Erreur dans POST /messages:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

module.exports = router;
