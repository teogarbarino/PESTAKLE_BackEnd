const User = require('../models/users');

const userExistsMiddleware = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.body.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = user; // Ajouter l'utilisateur à la requête
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = userExistsMiddleware;
