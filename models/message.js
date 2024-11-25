const mongoose = require('mongoose');

// Schéma du modèle Message
const MessageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // Utilisateur qui envoie le message
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // Utilisateur qui reçoit le message
  },
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true // Référence à la conversation
  },
  content: { 
    type: String, 
    required: true // Contenu du message
  },
  attachments: [{ 
    type: String, 
    default: [] // Liste d'URL pour les fichiers joints
  }],
  offer: { 
    type: Number, 
    default: null // Offre (optionnelle), valeur par défaut null
  },
  status: { 
    type: String, 
    enum: ['sent', 'accepted', 'rejected', 'countered'], 
    default: 'sent' // Statut par défaut : envoyé
  },
  createdAt: { 
    type: Date, 
    default: Date.now // Date de création
  }
});

// Création du modèle
const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
