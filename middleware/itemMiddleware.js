const Item = require('../models/items');

const itemOwnershipMiddleware = async (req, res, next) => {
  try {
    const itemId = req.params.itemId || req.body.item;
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    if (item.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de modifier cet article' });
    }

    req.item = item; // Ajouter l'article à la requête
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = itemOwnershipMiddleware;
