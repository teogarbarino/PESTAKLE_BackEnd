const Transaction = require('../models/transaction');

const transactionAccessMiddleware = async (req, res, next) => {
  try {
    const transactionId = req.params.transactionId;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    if (![transaction.buyer.toString(), transaction.seller.toString()].includes(req.user.id)) {
      return res.status(403).json({ error: 'Accès interdit à cette transaction' });
    }

    req.transaction = transaction; // Ajouter la transaction à la requête
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = transactionAccessMiddleware;
