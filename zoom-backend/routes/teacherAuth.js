const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');

// Signup
router.post('/signup', async (req, res) => {
    console.log('📝 Teacher Signup Request:', req.body);
    try {
        let { 
            fullName, email, password, 
            faceRegistered, voiceRegistered, fingerprintVerified 
        } = req.body;

        if (!email) return res.status(400).json({ message: 'Email is required' });
        email = email.trim().toLowerCase();

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            console.log('⚠️ Teacher already registered:', email);
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const teacher = new Teacher({
            fullName: fullName?.trim(),
            email,
            password: hashedPassword,
            faceRegistered: faceRegistered || false,
            voiceRegistered: voiceRegistered || false,
            fingerprintVerified: fingerprintVerified || false,
        });
        await teacher.save();

        console.log('✅ Teacher account created successfully:', email);
        res.status(201).json({ message: 'Account created successfully' });

    } catch (error) {
        console.error('❌ Teacher Signup Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

    // Pre-check removed

// Login
router.post('/login', async (req, res) => {
    console.log('🔑 Teacher Login Request:', req.body.email);
    try {
        let { email, password, faceVerified, secFactorVerified } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        email = email.trim().toLowerCase();

        const teacher = await Teacher.findOne({ email });
        if (!teacher) {
            console.log('⚠️ Teacher not found:', email);
            return res.status(400).json({ message: 'Email not found' });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            console.log('⚠️ Invalid password for teacher:', email);
            return res.status(400).json({ message: 'Invalid password' });
        }

        // ── Biometric Cross-Verification ──
        if (!faceVerified || !secFactorVerified) {
            console.log('⚠️ Biometrics not verified for teacher:', email);
            return res.status(400).json({ message: 'Biometric verification incomplete' });
        }

        // Check if teacher is registered for these in DB
        if (!teacher.faceRegistered || (!teacher.voiceRegistered && !teacher.fingerprintVerified)) {
            console.log('⚠️ Teacher not registered for biometrics:', email);
            return res.status(400).json({ message: 'Biometric records not found. Please re-register.' });
        }

        const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        console.log('✅ Teacher login successful:', email);
        res.status(200).json({
            message: 'Login successful',
            token,
            teacher: {
                _id: teacher._id,
                fullName: teacher.fullName,
                email: teacher.email,
                role: 'teacher',
            }
        });

    } catch (error) {
        console.error('❌ Teacher Login Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


module.exports = router;