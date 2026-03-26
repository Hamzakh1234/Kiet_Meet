const { RoomServiceClient } = require('livekit-server-sdk');
const dotenv = require('dotenv');
dotenv.config();

const roomService = new RoomServiceClient(
    process.env.LIVEKIT_URL.replace('wss://', 'https://'),
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
);

async function testConnection() {
    try {
        const rooms = await roomService.listRooms();
        console.log('Successfully connected to LiveKit! Rooms:', rooms);
    } catch (error) {
        console.error('Failed to connect to LiveKit:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testConnection();
