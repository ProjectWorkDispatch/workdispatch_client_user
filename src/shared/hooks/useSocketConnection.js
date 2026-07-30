import { useEffect } from 'react';
import { useAuthStore } from '../../features/auth/store/authStore.js';
import { useMessagesStore } from '../store/userStore.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';

export function useSocketConnection() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const receiveMessage = useMessagesStore((s) => s.receiveMessage);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(token);

    const handleNewMessage = (payload) => {
      receiveMessage(payload.message, payload.conversationId);
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [isAuthenticated, token, receiveMessage]);
}
