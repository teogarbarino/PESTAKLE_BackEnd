const mongoose = require('mongoose');
require('dotenv').config();
const modelsPath = '../models/';
const bcrypt = require('bcrypt');

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

async function migrateModel(model, updates = {}) {
    try {
        const collectionName = model.collection.collectionName;
        const collections = await mongoose.connection.db.listCollections().toArray();
        const exists = collections.some(col => col.name === collectionName);

        if (!exists) {
            await model.createCollection();
            console.log(`✅ Collection ${collectionName} créée.`);
        } else {
            console.log(`⚠️ Collection ${collectionName} existe déjà.`);
        }

        if (Object.keys(updates).length > 0) {
            await model.updateMany({}, { $set: updates });
            console.log(`🛠 Mise à jour des documents dans ${collectionName}.`);
        }
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

        await Promise.all([
            migrateModel(User, { trustIndex: 0, nbBoosted: 0, password: hashedpassword }),
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
