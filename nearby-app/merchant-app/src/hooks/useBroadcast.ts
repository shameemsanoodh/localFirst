import { useMutation, useQuery } from '@tanstack/react-query';
import { broadcastService } from '@/services/broadcast.service';
import { useBroadcastStore } from '@/store/broadcastStore';
import { useLocationStore } from '@/store/locationStore';
import { websocketService } from '@/services/websocket.service';
import { useEffect } from 'react';

interface CreateBroadcastData {
  productId: string;
  radius?: number;
}

export const useBroadcast = () => {
  const { activeBroadcast, setActiveBroadcast, clearActiveBroadcast } = useBroadcastStore();
  const { lat, lng } = useLocationStore();

  const createBroadcastMutation = useMutation({
    mutationFn: (data: CreateBroadcastData) => {
      if (!lat || !lng) {
        throw new Error('Location not available');
      }
      return broadcastService.create({
        productId: data.productId,
        productName: data.productId, // Use productId as name for now
        userLat: lat,
        userLng: lng,
        radius: data.radius || 5,
      });
    },
    onSuccess: (broadcast) => {
      setActiveBroadcast(broadcast);
      // Subscribe to broadcast responses via WebSocket
      websocketService.emit('broadcast:created', { broadcastId: broadcast.broadcastId });
    },
  });

  const cancelBroadcastMutation = useMutation({
    mutationFn: (broadcastId: string) => broadcastService.cancel(broadcastId),
    onSuccess: () => {
      clearActiveBroadcast();
    },
  });

  const { data: broadcastDetail, refetch: refetchBroadcast } = useQuery({
    queryKey: ['broadcast', activeBroadcast?.broadcastId],
    queryFn: () => broadcastService.getById(activeBroadcast!.broadcastId),
    enabled: !!activeBroadcast?.broadcastId,
    refetchInterval: 2000, // Poll every 2 seconds for updates
  });

  // Listen for WebSocket broadcast responses
  useEffect(() => {
    if (activeBroadcast?.broadcastId) {
      const handleResponse = () => {
        refetchBroadcast();
      };

      websocketService.on('broadcast:response', handleResponse);

      return () => {
        websocketService.off('broadcast:response', handleResponse);
      };
    }
  }, [activeBroadcast?.broadcastId, refetchBroadcast]);

  return {
    activeBroadcast,
    broadcastDetail,
    createBroadcast: createBroadcastMutation.mutate,
    cancelBroadcast: cancelBroadcastMutation.mutate,
    isCreating: createBroadcastMutation.isPending,
    isCancelling: cancelBroadcastMutation.isPending,
    error: createBroadcastMutation.error || cancelBroadcastMutation.error,
  };
};
