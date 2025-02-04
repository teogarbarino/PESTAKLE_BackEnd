const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    ageRange: {
        type: String,
        enum: ['0-3', '3-6', '6-9', '9-12'],
        required: true
    },
    productCondition: {
        type: String,
        enum: ['neuf', 'occasion', 'mauvais état'],
        required: true
    },
    categories: [{
        type: String
    }],
    brands: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

module.exports = UserProfile;