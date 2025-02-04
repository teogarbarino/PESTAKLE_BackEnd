

// 📌 **Inscription d'un utilisateur**
const express = require('express');
const router = express.Router();
const User = require('../models/users');
const UserSettings = require('../models/userSettings'); // Import du modèle UserSettings
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');

// 📌 **Inscription d'un utilisateur**
router.post('/register', [
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password should be at least 6 characters long').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Invalid inputs', errors: errors.array() });
  }

  const { username, email, password, profilePicture, bio, role, trustIndex, nbBoosted } = req.body;

  try {
    let user = await User.findOne({
      email, phoneNumber,
      ipAddress: clientIp,
    });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    user = new User({
      username,
      email,
      password: hashedPassword,
      profilePicture: profilePicture || null,
      bio: bio || '',
      role: role || 'user',
      trustIndex: 100,
      nbBoosted: 0,
      phoneNumber,
      ipAddress: getClientIp(req),
    });

    await user.save();

    // Création des paramètres utilisateur par défaut
    const userSettings = new UserSettings({
      user: user._id,
      theme: 'light',
      fontSize: 16
    });
    await userSettings.save();

    // Générer un token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
      },
      userSettings,
      token
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 📌 **Connexion d'un utilisateur**
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Générer un token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
    console.error('Erreur dans POST /login:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// 📌 **Obtenir les informations de l'utilisateur connecté**
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Récupérer les paramètres utilisateur associés
    const userSettings = await UserSettings.findOne({ user: req.user._id });

    res.status(200).json({
      user,
      userSettings
    });
  } catch (error) {
    console.error('Erreur dans GET /me:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// 📌 **Mettre à jour les paramètres utilisateur**
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { theme, fontSize } = req.body;

    let userSettings = await UserSettings.findOne({ user: req.user._id });
    if (!userSettings) {
      return res.status(404).json({ error: 'Paramètres utilisateur introuvables.' });
    }

    // Mettre à jour les paramètres
    userSettings.theme = theme || userSettings.theme;
    userSettings.fontSize = fontSize || userSettings.fontSize;
    userSettings.updatedAt = Date.now();

    await userSettings.save();

    res.status(200).json({ message: 'Paramètres mis à jour', userSettings });
  } catch (error) {
    console.error('Erreur dans PUT /settings:', error);
    res.status(500).json({ error: 'Erreur interne.' });
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
