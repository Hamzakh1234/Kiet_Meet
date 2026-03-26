const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/ma/Desktop/MY PERHAI/react native course/zoom-backend/.env' });

const StudentSchema = new mongoose.Schema({ email: String, firstName: String, lastName: String });
const TeacherSchema = new mongoose.Schema({ email: String, fullName: String });

// Use exact collection names as defined in models
const Student = mongoose.model('Student', StudentSchema, 'students');
const Teacher = mongoose.model('Teacher', TeacherSchema, 'teachers');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const students = await Student.find().limit(10);
        console.log('\n--- Recent Students (Collection: students) ---');
        if (students.length === 0) console.log('No students found.');
        students.forEach(u => console.log(`${u.firstName} ${u.lastName} - ${u.email}`));
        
        const teachers = await Teacher.find().limit(10);
        console.log('\n--- Recent Teachers (Collection: teachers) ---');
        if (teachers.length === 0) console.log('No teachers found.');
        teachers.forEach(t => console.log(`${t.fullName} - ${t.email}`));
        
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
