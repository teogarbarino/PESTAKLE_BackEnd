const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // Référence à l'utilisateur qui a passé la commande
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Référence à l'article commandé
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  // Champ pour le prix final convenu (contre-offre)
  price: {
    type: Number,
    default: 0
  },
  // Indique si la commande a été expédiée/envoyée
  isSent: {
    type: Boolean,
    default: false
  },
  // Indique si les deux parties ont confirmé la réception de l'objet
  isConfirm: {
    type: Boolean,
    default: false
  },
  // Référence optionnelle à la conversation associée à cette commande
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Création du modèle Order
const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
