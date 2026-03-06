import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersService } from '@/services/offers.service';
import { useLocationStore } from '@/store/locationStore';
import { useUIStore } from '@/store/uiStore';

interface UseOffersParams {
  lat: number | null;
  lng: number | null;
  radius?: number;
  categoryId?: string;
}

export const useOffers = (params?: UseOffersParams | string) => {
  const queryClient = useQueryClient();
  const locationStore = useLocationStore();
  const { showToast } = useUIStore();

  // Handle both old (string) and new (object) parameter formats
  const categoryId = typeof params === 'string' ? params : params?.categoryId;
  const lat = typeof params === 'object' ? params.lat : locationStore.lat;
  const lng = typeof params === 'object' ? params.lng : locationStore.lng;
  const radius = typeof params === 'object' ? params.radius : undefined;

  const { data: offers, isLoading, error } = useQuery({
    queryKey: ['offers', 'nearby', lat, lng, categoryId, radius],
    queryFn: async () => {
      if (!lat || !lng) return [];
      return offersService.getNearby({ lat, lng, categoryId, radius });
    },
    enabled: !!lat && !!lng,
  });

  const reserveMutation = useMutation({
    mutationFn: (offerId: string) => offersService.reserve(offerId),
    onSuccess: () => {
      showToast('Offer reserved successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
    onError: () => {
      showToast('Failed to reserve offer', 'error');
    },
  });

  const likeMutation = useMutation({
    mutationFn: (offerId: string) => offersService.like(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: (offerId: string) => offersService.unlike(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  return {
    offers: offers || [],
    isLoading,
    error,
    reserveOffer: reserveMutation.mutate,
    likeOffer: likeMutation.mutate,
    unlikeOffer: unlikeMutation.mutate,
    isReserving: reserveMutation.isPending,
  };
};
