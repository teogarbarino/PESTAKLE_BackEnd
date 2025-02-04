const mongoose = require('mongoose');
require('dotenv').config();
const modelsPath = '../models/';

// Importation des modèles
const User = require(`${modelsPath}user`);
const Item = require(`${modelsPath}item`);
const Transaction = require(`${modelsPath}transaction`);
const Conversation = require(`${modelsPath}conversation`);
const Favorite = require(`${modelsPath}favorite`);
const Message = require(`${modelsPath}message`);
const Order = require(`${modelsPath}order`);
const UserSettings = require(`${modelsPath}usersettings`);
const Wishlist = require(`${modelsPath}wishlist`);
const UserProfile = require(`${modelsPath}userprofile`);

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
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('🚀 Connexion MongoDB réussie. Lancement des migrations...');

        await Promise.all([
            migrateModel(User, { trustIndex: 0, nbBoosted: 0 }),
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
