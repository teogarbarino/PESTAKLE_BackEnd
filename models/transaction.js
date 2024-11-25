const mongoose = require('mongoose');

// Schéma du modèle Transaction
const TransactionSchema = new mongoose.Schema({
  buyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // Acheteur obligatoire
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // Vendeur obligatoire
  },
  item: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item', 
    required: true // Article obligatoire
  },
  price: { 
    type: Number, 
    required: true, // Prix obligatoire
    min: 0 // Assurez-vous que le prix est toujours positif ou nul
  },
  transactionStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'pending' // Statut initial par défaut : en attente
  },
  paymentMethod: { 
    type: String, 
    enum: ['credit_card', 'paypal', 'bank_transfer'], 
    required: true // Méthode de paiement obligatoire
  },
  createdAt: { 
    type: Date, 
    default: Date.now // Date de création par défaut
  }
});

// Création du modèle
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
