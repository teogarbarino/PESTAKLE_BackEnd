const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcrypt');

const modelsPath = '../models/';

// Importation des modèles
const User = require(`${modelsPath}users`);
const Item = require(`${modelsPath}items`);
const Transaction = require(`${modelsPath}transaction`);
const Conversation = require(`${modelsPath}conversation`);
const Favorite = require(`${modelsPath}favoris`);
const Message = require(`${modelsPath}message`);
const Order = require(`${modelsPath}order`);
const UserSettings = require(`${modelsPath}userSettings`);
const Wishlist = require(`${modelsPath}wishlist`);
const UserProfile = require(`${modelsPath}userProfile`);

async function resetCollection(model) {
    try {
        const collectionName = model.collection.collectionName;

        console.log(`🗑 Suppression de la collection ${collectionName}...`);
        await mongoose.connection.dropCollection(collectionName).catch(err => {
            if (err.code === 26) {
                console.log(`⚠️ Collection ${collectionName} n'existe pas encore.`);
            } else {
                throw err;
            }
        });

        console.log(`✅ Recréation de la collection ${collectionName}...`);
        await model.createCollection();
    } catch (error) {
        console.error(`❌ Erreur de suppression/recréation pour ${model.collection.collectionName}:`, error);
    }
}

async function migrateModel(model, updates = {}) {
    try {
        const collectionName = model.collection.collectionName;

        if (Object.keys(updates).length > 0) {
            console.log(`🛠 Mise à jour des documents dans ${collectionName}...`);
            await model.updateMany({}, { $set: updates });
        }

        console.log(`✅ Migration terminée pour ${collectionName}.`);
    } catch (error) {
        console.error(`❌ Erreur de migration pour ${model.collection.collectionName}:`, error);
    }
}

async function runMigrations() {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('🚀 Connexion MongoDB réussie. Lancement des migrations...');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("DefaultPassword123!", salt);

        // Suppression et recréation des collections
        await Promise.all([
            resetCollection(User),
            resetCollection(Item),
            resetCollection(Transaction),
            resetCollection(Conversation),
            resetCollection(Favorite),
            resetCollection(Message),
            resetCollection(Order),
            resetCollection(UserSettings),
            resetCollection(Wishlist),
            resetCollection(UserProfile),
        ]);

        // Ajout des mises à jour
        await Promise.all([
            migrateModel(User, { trustIndex: 0, nbBoosted: 0, password: hashedPassword }),
            migrateModel(Item, { reports: 0, boosted: false }),
            migrateModel(Transaction, {}),
            migrateModel(Conversation, {}),
            migrateModel(Favorite, {}),
            migrateModel(Message, {}),
            migrateModel(Order, {}),
            migrateModel(UserSettings, { theme: 'light', fontSize: 16 }),
            migrateModel(Wishlist, {}),
            migrateModel(UserProfile, {}),
        ]);

        console.log('✅ Toutes les migrations sont terminées.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors des migrations:', error);
        process.exit(1);
    }
}

runMigrations();
