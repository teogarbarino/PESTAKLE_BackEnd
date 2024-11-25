const mongoose = require('mongoose');

// Schéma du modèle Utilisateur
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  profilePicture: { type: String, default: null },
  bio: { type: String, default: '' },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  trustIndex: { type: Number, default: 0, min: 0, max: 100 }, // Indice de confiance (0 à 100)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware : Avant de supprimer un utilisateur
UserSchema.pre('remove', async function (next) {
  const userId = this._id;

  // Suppression des articles de l'utilisateur
  await Item.deleteMany({ user: userId });

  // Suppression des favoris de l'utilisateur
  await Favorite.deleteMany({ user: userId });

  // Suppression des transactions impliquant l'utilisateur comme acheteur ou vendeur
  await Transaction.deleteMany({ $or: [{ buyer: userId }, { seller: userId }] });

  // Suppression des conversations impliquant l'utilisateur (les messages seront supprimés en cascade)
  const conversations = await Conversation.find({ users: userId });
  for (const conversation of conversations) {
    await conversation.remove();
  }

  next();
});

// Création du modèle
const User = mongoose.model('User', UserSchema);

module.exports = User;
