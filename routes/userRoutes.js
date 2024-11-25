const express = require('express');
const router = express.Router();
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/authMiddleware');
const userExistsMiddleware = require('../middleware/userMiddleware');

// Inscription d'un utilisateur
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'Utilisateur inscrit avec succès.', user: newUser });
  } catch (error) {
    console.error('Erreur dans POST /signup:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Connexion d'un utilisateur
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Générer un token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Connexion réussie.', token, user });
  } catch (error) {
    console.error('Erreur dans POST /login:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Obtenir les informations de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error('Erreur dans GET /me:', error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

module.exports = router;
