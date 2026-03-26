const Class = require('../models/Class');

/**
 * Background scheduler to check for meetings that are starting
 */
const startMeetingScheduler = () => {
    console.log('🕒 Meeting Scheduler Started');
    
    // Check every 1 minute
    setInterval(async () => {
        try {
            const now = new Date();
            // Find classes that have scheduled meetings starting now (or slightly past) and haven't notified yet
            const classes = await Class.find({
                'scheduledMeetings': {
                    $elemMatch: {
                        scheduledDate: { $lte: now },
                        notified: false
                    }
                }
            });

            for (const cls of classes) {
                let updated = false;
                cls.scheduledMeetings.forEach(meeting => {
                    if (meeting.scheduledDate <= now && !meeting.notified) {
                        // 1. Post "Starting Now" announcement
                        cls.announcements.push({
                            text: `🔔 REMINDER: ${meeting.text} is starting now!`,
                            createdAt: new Date()
                        });
                        
                        // 2. Mark as notified
                        meeting.notified = true;
                        updated = true;
                        console.log(`📢 Sent reminder for class: ${cls.className}`);
                    }
                });

                if (updated) {
                    await cls.save();
                }
            }
        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    }, 60000); 
};

module.exports = startMeetingScheduler;
