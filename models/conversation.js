const mongoose = require('mongoose');

// Schéma du modèle Conversation
const ConversationSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], // Liste des utilisateurs impliqués
  createdAt: { type: Date, default: Date.now } // Date de création de la conversation
});

// Middleware : Avant de supprimer une conversation
ConversationSchema.pre('remove', async function (next) {
  const conversationId = this._id;

  try {
    // Suppression des messages associés à cette conversation
    await Message.deleteMany({ conversationId: conversationId });

    next(); // Passe à l'étape suivante
  } catch (err) {
    next(err); // Gère les erreurs et les transmet au middleware d'Express
  }
});

// Création du modèle
const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;
