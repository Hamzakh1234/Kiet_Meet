const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const teacherAuthRoutes = require('./routes/teacherAuth');
const classRoutes = require('./routes/classRoutes');
const livekitRoutes = require('./routes/livekitRoutes');
const startMeetingScheduler = require('./utils/meetingScheduler');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherAuthRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/livekit', livekitRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
            startMeetingScheduler();
        });
    })
    .catch((error) => {
        console.log('Connection failed', error);
    });