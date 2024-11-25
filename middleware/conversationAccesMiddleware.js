const Conversation = require('../models/Conversation');

const conversationAccessMiddleware = async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    if (!conversation.users.includes(req.user.id)) {
      return res.status(403).json({ error: 'Accès interdit à cette conversation' });
    }

    req.conversation = conversation; // Ajouter la conversation à la requête
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = conversationAccessMiddleware;
