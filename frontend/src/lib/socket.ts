import { io, Socket } from 'socket.io-client';
import { authStorage } from '@/lib/api';

const SOCKET_URL = 'http://localhost:3000';

let socket: Socket | null = null;

export const getSocket = () => {
  const token = authStorage.getAccessToken();
  if (!socket || socket.disconnected) {
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

