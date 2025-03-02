// 📌 **Inscription d'un utilisateur**
const express = require('express');
const router = express.Router();
const User = require('../models/users');
const UserSettings = require('../models/userSettings'); // Import du modèle UserSettings
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');

console.log("🚀 Routeur utilisateur chargé");

// 📌 **Inscription d'un utilisateur**
router.post('/register', [
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password should be at least 6 characters long').isLength({ min: 6 }),
], async (req, res) => {
  console.log("🔵 Requête reçue sur /register");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("🔴 Erreur de validation:", errors.array());
    return res.status(422).json({ message: 'Invalid inputs', errors: errors.array() });
  }

  const { username, email, password, profilePicture, bio, role, phoneNumber } = req.body;
  console.log("🟢 Données reçues:", { username, email, profilePicture, bio, role, phoneNumber });

  try {
    console.log("🔍 Vérification si l'utilisateur existe déjà...");
    let user = await User.findOne({ email });

    if (user) {
      console.log("🔴 Utilisateur déjà existant:", user.email);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log("📝 Création de l'utilisateur...");
    user = new User({
      username,
      email,
      password,
      profilePicture: profilePicture || null,
      bio: bio || '',
      role: role || 'user',
      trustIndex: 100,
      nbBoosted: 0,
      phoneNumber,
      ipAddress: getClientIp(req),
    });

    await user.save();
    console.log("✅ Utilisateur enregistré avec ID:", user._id);

    // Vérifions que le mot de passe a bien été hashé après enregistrement
    const userFromDB = await User.findOne({ email }).select('+password');
    console.log("🔍 Vérification en base: Mot de passe hashé ?", userFromDB.password.startsWith('$2b$') ? "✅ OUI" : "❌ NON");

    // Création des paramètres utilisateur par défaut
    console.log("🛠️ Création des paramètres utilisateur...");
    const userSettings = new UserSettings({
      user: user._id,
      theme: 'light',
      fontSize: 16
    });
    await userSettings.save();
    console.log("✅ Paramètres utilisateur créés");

    // Générer un token JWT
    console.log("🔐 Génération du token...");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    console.log("✅ Inscription réussie !");
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        role: user.role,
        trustIndex: user.trustIndex,
        nbBoosted: user.nbBoosted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        password: user.password,
      },
      userSettings,
      token,
    });

  } catch (err) {
    console.error("🔴 Erreur serveur:", err.message);
    res.status(500).send('Server Error');
  }
});

// 📌 **Connexion d'un utilisateur**
router.post('/login', async (req, res) => {
  try {
    console.log("🔵 Requête reçue sur /login");
    const { email, password } = req.body;
    console.log("🟢 Données reçues:", { email });

    // Vérification de l'utilisateur en base de données
    const user = await User.findOne({ email });

    if (!user) {
      console.log("🔴 Utilisateur introuvable:", email);
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    console.log("🟢 Utilisateur trouvé en base avec ID:", user._id.toString());

    // Vérification du mot de passe
    console.log("🔑 Vérification du mot de passe...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("🔴 Mot de passe incorrect pour:", user.email);
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Générer un token JWT
    console.log("🔐 Génération du token avec ID:", user._id.toString());
    const token = jwt.sign(
      { id: user._id.toString() },  // 🔥 Assure-toi que l'ID est bien en `string`
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log("✅ Connexion réussie ! Token généré.");
    res.status(200).json({
      message: 'Connexion réussie.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        trustIndex: user.trustIndex,
        nbBoosted: user.nbBoosted
      }
    });

  } catch (error) {
    console.error("🔴 Erreur serveur dans /login:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

router.put('/boost', authMiddleware, async (req, res) => {
  try {
    console.log(`🔵 Requête reçue sur /users/boost par l'utilisateur ${req.user._id}`);

    const { nbBoosted } = req.body;

    if (!nbBoosted || nbBoosted <= 0) {
      return res.status(400).json({ error: "Le nombre de boosts doit être supérieur à 0." });
    }

    // Mettre à jour le nbBoosted de l'utilisateur
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { nbBoosted: nbBoosted } }, // ✅ Ajoute `nbBoosted` à l'existant
      { new: true, runValidators: true }
    );

    console.log(`✅ ${nbBoosted} boosts ajoutés à l'utilisateur ${req.user._id}`);
    res.status(200).json({
      message: `Boosts ajoutés avec succès !`,
      user: {
        id: user._id,
        username: user.username,
        nbBoosted: user.nbBoosted
      }
    });

  } catch (error) {
    console.error("❌ Erreur dans PUT /users/boost:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

router.get('/trust-index', authMiddleware, async (req, res) => {
  try {
    console.log(`🔵 Calcul de l'index de confiance pour ${req.user._id}`);

    // Récupérer tous les articles de l'utilisateur (hors deleted)
    const userItems = await Item.find({ user: req.user._id, status: { $ne: "deleted" } });

    // Vérifier si l'utilisateur a au moins 10 articles actifs
    const totalItems = userItems.length;
    if (totalItems < 10) {
      return res.status(200).json({
        trustIndex: null,
        message: "Pas assez d'articles pour calculer un index de confiance fiable. (Minimum requis: 10)"
      });
    }

    // Filtrer les articles non protégés pour le calcul
    const filteredItems = userItems.filter(item => item.status !== "protected");

    // Vérifier s'il reste encore des articles après filtrage
    if (filteredItems.length === 0) {
      return res.status(200).json({
        trustIndex: 1,
        message: "Tous les articles sont protégés. Index de confiance maximal."
      });
    }

    // Nombre d'articles flaggés (hors protected)
    const nbFlagged = filteredItems.filter(item => item.status === "flagged").length;

    // Moyenne des signalements (hors protected)
    const totalReports = filteredItems.reduce((sum, item) => sum + item.reports, 0);
    const avgReports = totalReports / filteredItems.length;

    // 📌 Calcul de l'index de confiance avec exclusion des protected
    const trustIndex = Math.max(0, 1 - ((nbFlagged + avgReports) / (filteredItems.length + 1)));

    console.log(`✅ Index de confiance calculé : ${trustIndex}`);

    res.status(200).json({
      trustIndex: trustIndex.toFixed(2),
      totalItems,
      analyzedItems: filteredItems.length,
      nbFlagged,
      avgReports: avgReports.toFixed(2)
    });

  } catch (error) {
    console.error("❌ Erreur dans GET /users/trust-index:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});


function getClientIp(req) {
  let ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress;

  if (ip.includes(",")) {
    ip = ip.split(",")[0];
  }

  return ip.replace("::ffff:", "");
}

module.exports = router;
