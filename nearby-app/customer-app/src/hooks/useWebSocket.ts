import { useEffect, useCallback } from 'react';
import { websocketService } from '@/services/websocket.service';
import { useAuthStore } from '@/store/authStore';

type EventHandler = (data: unknown) => void;

export const useWebSocket = () => {
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      websocketService.connect(token);

      return () => {
        websocketService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  const subscribe = useCallback((event: string, handler: EventHandler) => {
    websocketService.on(event, handler);
    return () => websocketService.off(event, handler);
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    websocketService.emit(event, data);
  }, []);

  return {
    subscribe,
    emit,
    isConnected: !!token && isAuthenticated,
  };
};
