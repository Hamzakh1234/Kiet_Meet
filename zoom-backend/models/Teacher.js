const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    faceRegistered: { type: Boolean, default: false },
    voiceRegistered: { type: Boolean, default: false },
    fingerprintVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema, 'teachers');