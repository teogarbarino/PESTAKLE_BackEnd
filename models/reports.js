const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true }, // L'article signalé
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // L'utilisateur qui signale
    reason: { type: String, required: true }, // Raison du signalement
    createdAt: { type: Date, default: Date.now } // Date du signalement
});

// Création du modèle
const Report = mongoose.model('Report', ReportSchema);

module.exports = Report;
