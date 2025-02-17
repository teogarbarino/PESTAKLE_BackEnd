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
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

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

    const user = await User.findOne({ email });
    if (!user) {
      console.log("🔴 Utilisateur introuvable:", email);
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // Vérification du mot de passe
    console.log("🔑 Vérification du mot de passe...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("🔴 Mot de passe incorrect");
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Générer un token JWT
    console.log("🔐 Génération du token...");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log("✅ Connexion réussie !");
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
    console.error(password, user.password);
    res.status(500).json({ error: $password });
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
