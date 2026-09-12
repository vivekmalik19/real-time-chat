import { io } from 'socket.io-client';

// Use same host in development via proxy, or fallback to port 5000
const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export const connectSocket = (user) => {
  if (!socket.connected) {
    socket.connect();
  }
  if (user) {
    socket.emit('user:join', user);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
