// app/config.js

const IP_ADDRESS = '192.168.1.23'; // Update this whenever your PC restarts and IP changes

export const BASE_URL = `http://${IP_ADDRESS}:5000/api`;
export const SOCKET_URL = `http://${IP_ADDRESS}:5000`; // If you use sockets in the future
export const PYTHON_SERVICE_URL = `http://${IP_ADDRESS}:5001`; // For face service if needed
export const LIVEKIT_URL = 'https://kiety-meet-i2vdi72y.livekit.cloud';
