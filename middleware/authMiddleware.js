const jwt = require('jsonwebtoken');
const User = require('../models/users');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Récupérer le token Bearer
    if (!token) return res.status(401).json({ error: 'Accès non autorisé' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ error: 'Utilisateur non trouvé' });

    req.user = user; // Ajouter l'utilisateur au contexte de la requête
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = authMiddleware;
