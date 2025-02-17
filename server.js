const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
require('dotenv').config();
const connectDB = require('./db.js');

// Connecte-toi à la base de données
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware pour analyser le corps des requêtes
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Ajout de support pour JSON
app.use(express.json());

// Définir le port
const PORT = process.env.PORT || 3000;

// Routes
app.use('/users', require('./routes/userRoutes'));
app.use('/items', require('./routes/itemRoutes'));
/*
app.use('/settings', require('./routes/userSettingsRoutes'));

app.use('/favorites', require('./routes/favoriteRoutes'));
app.use('/conversations', require('./routes/conversationRoutes'));
app.use('/messages', require('./routes/messageRouter')); 
app.use('/transactions', require('./routes/transactionRoute')); */
// Lancer le serveur
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
