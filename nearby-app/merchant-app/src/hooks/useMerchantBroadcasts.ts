import { useQuery } from '@tanstack/react-query';
import { broadcastService } from '@/services/broadcast.service';

export const useMerchantBroadcasts = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant', 'broadcasts'],
    queryFn: () => broadcastService.getMerchantBroadcasts(),
  });

  return {
    broadcasts: data || [],
    isLoading,
    error,
  };
};
