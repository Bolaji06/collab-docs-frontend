import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.DEV ? import.meta.env.VITE_DEV_API_URL : import.meta.env.VITE_API_URL;
// Remove /api from URL for socket.io if it's there
const SOCKET_URL = API_URL.replace('/api', '');

let socket: Socket | null = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            autoConnect: true
        });

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }
    return socket;
};

export const joinUserRoom = (userId: string) => {
    const s = getSocket();
    if (s) {
        s.emit('join-user-room', userId);
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
