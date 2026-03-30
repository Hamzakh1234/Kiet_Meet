const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Signup
router.post('/signup', async (req, res) => {
    console.log('📝 Student Signup Request:', req.body);
    try {
        let { 
            fullName, email, phone, university, semester, password,
            faceRegistered, voiceRegistered, fingerprintVerified 
        } = req.body;

        if (!email) return res.status(400).json({ message: 'Email is required' });
        email = email.trim().toLowerCase();

        const existingUser = await Student.findOne({ email });
        if (existingUser) {
            console.log('⚠️ Student already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new Student({
            fullName:  fullName?.trim(),
            email,
            phone,
            university: university?.trim(),
            semester,
            password: hashedPassword,
            faceRegistered: faceRegistered || false,
            voiceRegistered: voiceRegistered || false,
            fingerprintVerified: fingerprintVerified || false,
        });
        await user.save();

        console.log('✅ Student created successfully:', email);
        res.status(201).json({ message: 'User created successfully' });

    } catch (error) {
        console.error('❌ Student Signup Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

    // Pre-check removed

// Login (Final execution after biometrics)
router.post('/login', async (req, res) => {
    console.log('🔑 Student Login Request:', req.body.email);
    try {
        let { email, password, faceVerified, secFactorVerified } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        email = email.trim().toLowerCase();

        const user = await Student.findOne({ email });
        if (!user) {
            console.log('⚠️ Student not found:', email);
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('⚠️ Invalid password for:', email);
            return res.status(400).json({ message: 'Invalid password' });
        }

        // ── Biometric Cross-Verification ──
        if (!faceVerified || !secFactorVerified) {
            console.log('⚠️ Biometrics not verified for:', email);
            return res.status(400).json({ message: 'Biometric verification incomplete' });
        }

        // Optional: Check if user is actually registered for these in DB
        if (!user.faceRegistered || (!user.voiceRegistered && !user.fingerprintVerified)) {
            console.log('⚠️ User not registered for biometrics:', email);
            return res.status(400).json({ message: 'Biometric records not found. Please re-register.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        console.log('✅ Student login successful:', email);
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                university: user.university,
                semester: user.semester,
                role: 'student',
            }
        });

    } catch (error) {
        console.error('❌ Student Login Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


module.exports = router;