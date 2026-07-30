import { io } from 'socket.io-client';

const DEFAULT_API_URL = import.meta.env.VITE_USER_URL || 'http://localhost:3002/workDispatch/v1';
const SOCKET_URL = DEFAULT_API_URL.replace(/\/workDispatch\/v1\/?$/, '');

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
