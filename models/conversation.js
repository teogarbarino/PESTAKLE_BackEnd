const mongoose = require('mongoose');


const ConversationSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }], // Liste des utilisateurs impliqués
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }, // Optionnel : référence à la commande liée à la conversation
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour supprimer les messages associés à une conversation
ConversationSchema.pre('remove', async function (next) {
  const conversationId = this._id;
  try {
    await Message.deleteMany({ conversationId: conversationId });
    next();
  } catch (err) {
    next(err);
  }
});

const Conversation = mongoose.model('Conversation', ConversationSchema);
module.exports = Conversation;
