const jwt = require('jsonwebtoken');
const User = require('../models/users');

const authMiddleware = async (req, res, next) => {
  try {
    console.log("🔵 Middleware auth exécuté");
    const token = req.headers.authorization?.split(' ')[1]; // Récupérer le token Bearer

    if (!token) {
      console.log("🔴 Aucun token fourni");
      return res.status(401).json({ error: 'Accès non autorisé' });
    }

    console.log("🟢 Token reçu:", token);

    // Décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🟢 Token décodé, ID utilisateur:", decoded.id);

    // Vérifier si l'utilisateur existe encore en base
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("🔴 Utilisateur non trouvé en base avec ID:", decoded.id);
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    console.log("✅ Utilisateur authentifié avec succès:", user._id.toString());
    req.user = user; // Ajouter l'utilisateur à la requête pour les prochaines étapes
    next();
  } catch (error) {
    console.error("🔴 Erreur dans authMiddleware:", error);
    return res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = authMiddleware;
