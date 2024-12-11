const Message = require('../models/message');

const messageAccessMiddleware = async (req, res, next) => {
  try {
    const messageId = req.params.messageId;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    if (![message.sender.toString(), message.recipient.toString()].includes(req.user.id)) {
      return res.status(403).json({ error: 'Accès interdit à ce message' });
    }

    req.message = message; // Ajouter le message à la requête
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = messageAccessMiddleware;
