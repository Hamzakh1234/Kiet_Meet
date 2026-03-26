const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    className:  { type: String, required: true },
    classCode:  { type: String, required: true, unique: true }, // 8-char alphanumeric ID
    limit:      { type: Number, required: true },
    teacherId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    teacherName:{ type: String },
    announcements: [
        {
            text:      { type: String },
            createdAt: { type: Date, default: Date.now },
        }
    ],
    meetingStatus: { type: String, enum: ['idle', 'live'], default: 'idle' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    scheduledMeetings: [
        {
            scheduledDate: { type: Date, required: true },
            text:          { type: String },
            notified:      { type: Boolean, default: false }, // To track if "starting now" notification was sent
        }
    ],
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema, 'Classes');