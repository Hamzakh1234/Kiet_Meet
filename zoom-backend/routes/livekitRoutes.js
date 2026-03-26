const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');

router.post('/token', async (req, res) => {
    try {
        const { roomName, participantName } = req.body;

        if (!roomName || !participantName) {
            return res.status(400).json({ message: 'roomName and participantName required' });
        }

        // Sanitize identity: LiveKit identities are safer without spaces
        const identity = participantName.trim().replace(/\s+/g, '_');

        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            { 
                identity: identity,
                name:     participantName, // Keep original name for display
            }
        );

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishScreen: true,
        });

        const token = await at.toJwt(); // at.toJwt() is asynchronous in version 2.15.0
        res.json({ token });

    } catch (error) {
        console.log('LiveKit token error:', error);
        res.status(500).json({ message: 'Token generation failed' });
    }
});

module.exports = router;