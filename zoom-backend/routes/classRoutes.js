const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Student = require('../models/Student');

// ── 8-char alphanumeric ID generator ──
const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// ── Create Class ──────────────────────
router.post('/create', async (req, res) => {
    try {
        const { className, limit, teacherId, teacherName } = req.body;

        if (!className || !limit || !teacherId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Generate unique class code
        let classCode;
        let exists = true;
        while (exists) {
            classCode = generateClassCode();
            exists = await Class.findOne({ classCode });
        }

        const newClass = new Class({
            className,
            classCode,
            limit: Number(limit),
            teacherId,
            teacherName,
        });

        await newClass.save();

        res.status(201).json({
            message: 'Class created successfully',
            class: {
                className:  newClass.className,
                classCode:  newClass.classCode,
                limit:      newClass.limit,
                teacherId:  newClass.teacherId,
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// ── Join Class (Student) ──────────────
router.post('/join', async (req, res) => {
    try {
        const { classCode, studentId } = req.body;
        
        if (!classCode || !studentId) {
            return res.status(400).json({ message: 'Class code and student ID are required' });
        }

        const cls = await Class.findOne({ classCode: classCode.toUpperCase() });
        if (!cls) return res.status(404).json({ message: 'Class not found. Check the code!' });

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Check if limit is reached
        if (cls.students.length >= cls.limit) {
            return res.status(400).json({ message: 'Class is full! Limit reached.' });
        }

        // Check if already joined
        if (!student.joinedClasses.includes(cls._id)) {
            student.joinedClasses.push(cls._id);
            await student.save();
            
            // Also add to Class's students list if not there
            if (!cls.students.includes(studentId)) {
                cls.students.push(studentId);
                await cls.save();
            }
        }

        res.status(200).json({ 
            message: 'Joined successfully',
            class: cls 
        });
    } catch (error) {
        console.error('Join error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Get Teacher's Classes ─────────────
router.get('/my-classes/:teacherId', async (req, res) => {
    try {
        const classes = await Class.find({ teacherId: req.params.teacherId });
        res.status(200).json({ classes });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// ── Get Student's Joined Classes ──────
router.get('/joined-classes/:studentId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId).populate('joinedClasses');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.status(200).json({ classes: student.joinedClasses || [] });
    } catch (error) {
        console.error('Fetch joined classes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Get Single Class ──────────────────
router.get('/:classId', async (req, res) => {
    try {
        const cls = await Class.findById(req.params.classId).populate('students', 'firstName lastName');
        res.status(200).json({ class: cls });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Update Meeting Status ──────────────
router.patch('/:classId/status', async (req, res) => {
    try {
        const { status } = req.body;
        const cls = await Class.findByIdAndUpdate(
            req.params.classId,
            { meetingStatus: status },
            { new: true }
        );
        res.status(200).json({ status: cls.meetingStatus });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Schedule Meeting ──────────────────
router.post('/:classId/schedule', async (req, res) => {
    try {
        const { scheduledDate, text } = req.body;
        const cls = await Class.findById(req.params.classId);
        
        // Add to scheduled meetings
        cls.scheduledMeetings.push({ scheduledDate, text });
        
        // Also post an immediate announcement
        cls.announcements.push({ text: `📅 New Meeting Scheduled: ${text}` });
        
        await cls.save();
        res.status(201).json({ 
            scheduledMeetings: cls.scheduledMeetings,
            announcements: cls.announcements 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Get Announcements ─────────────────
router.get('/:classId/announcements', async (req, res) => {
    try {
        const cls = await Class.findById(req.params.classId);
        if (!cls) return res.status(404).json({ message: 'Class not found' });
        res.status(200).json({ announcements: cls.announcements || [] });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Post Announcement ─────────────────
router.post('/:classId/announcements', async (req, res) => {
    try {
        const { text } = req.body;
        const cls = await Class.findById(req.params.classId);
        cls.announcements.push({ text });
        await cls.save();
        res.status(201).json({ announcements: cls.announcements });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Get All Announcements for Student ──────
router.get('/all-announcements/:studentId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId).populate('joinedClasses');
        if (!student) return res.status(404).json({ message: 'Student not found' });

        let allAnnouncements = [];
        student.joinedClasses.forEach(cls => {
            if (cls.announcements && cls.announcements.length > 0) {
                const classAnnos = cls.announcements.map(anno => ({
                    ...anno.toObject(),
                    classId: cls._id,
                    className: cls.className,
                    classCode: cls.classCode,
                    teacherName: cls.teacherName
                }));
                allAnnouncements = [...allAnnouncements, ...classAnnos];
            }
        });

        // Filter out dismissed announcements
        const dismissed = (student.dismissedAnnouncements || []).map(id => id.toString());
        allAnnouncements = allAnnouncements.filter(anno => !dismissed.includes(anno._id.toString()));

        // Sort by date (newest first)
        allAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ announcements: allAnnouncements });
    } catch (error) {
        console.error('Fetch all announcements error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Dismiss Announcement ─────────────────
router.post('/dismiss-announcement', async (req, res) => {
    try {
        const { studentId, announcementId } = req.body;
        if (!studentId || !announcementId) {
            return res.status(400).json({ message: 'studentId and announcementId are required' });
        }

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Add to dismissed list if not already there
        if (!student.dismissedAnnouncements.includes(announcementId)) {
            student.dismissedAnnouncements.push(announcementId);
            await student.save();
        }

        res.status(200).json({ message: 'Announcement dismissed' });
    } catch (error) {
        console.error('Dismiss error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// -- Get Class Participants ------------
router.get('/participants/:classId', async (req, res) => {
    try {
        const cls = await Class.findById(req.params.classId).populate('students', 'firstName lastName email photo');
        if (!cls) return res.status(404).json({ message: 'Class not found' });
        res.status(200).json({ participants: cls.students || [] });
    } catch (error) {
        console.error('Fetch participants error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// -- Remove Student from Class ----------
router.post('/remove-student', async (req, res) => {
    try {
        const { classId, studentId } = req.body;
        if (!classId || !studentId) {
            return res.status(400).json({ message: 'classId and studentId are required' });
        }

        const cls = await Class.findById(classId);
        if (!cls) return res.status(404).json({ message: 'Class not found' });

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Remove from Class.students
        cls.students = cls.students.filter(id => id && id.toString() !== studentId.toString());
        await cls.save();

        // Remove from Student.joinedClasses
        student.joinedClasses = student.joinedClasses.filter(id => id && id.toString() !== classId.toString());
        await student.save();

        res.status(200).json({ message: 'Student removed successfully' });
    } catch (error) {
        console.error('Remove student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
