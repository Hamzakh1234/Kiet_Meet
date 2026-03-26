const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    phone:     { type: String },
    university:{ type: String },
    semester:  { type: String },
    password:  { type: String, required: true },
    photo:     { type: String },
    faceRegistered: { type: Boolean, default: false },
    voiceRegistered: { type: Boolean, default: false },
    fingerprintVerified: { type: Boolean, default: false },
    joinedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    dismissedAnnouncements: [{ type: mongoose.Schema.Types.ObjectId }],
}, { timestamps: true });

module.exports = mongoose.model('Student', userSchema, 'students');