const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Item = require('../models/Item');
const Transaction = require('./models/Transaction');
const Conversation = require('./models/Conversation');
const Favorite = require('./models/Favorite');
const Message = require('./models/Message');
const Order = require('./models/Order');
const UserSettings = require('./models/UserSettings');
const Wishlist = require('./models/Wishlist');
const UserProfile = require('./models/UserProfile');

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
