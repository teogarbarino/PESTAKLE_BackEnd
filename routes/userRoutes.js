const express = require('express');
const router = express.Router();
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/authMiddleware');
const userExistsMiddleware = require('../middleware/userMiddleware');

// Inscription d'un utilisateur
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password should be at least 6 characters long').isLength({ min: 6 }),
    check('photo', 'Photo is required').not().isEmpty()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Invalid inputs', errors: errors.array() });
    }
  
    const { name, email, password, photo } = req.body;
  
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      user = new User({
        name,
        email,
        password,
        photo
      });
  
      
      await user.save();
  
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
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
