import { useQuery } from '@tanstack/react-query';
import { merchantsService } from '@/services/merchants.service';
import { useLocationStore } from '@/store/locationStore';

interface NearbyMerchantsParams {
  lat?: number;
  lng?: number;
  radius?: number;
  categoryId?: string;
}

export const useMerchants = (params: NearbyMerchantsParams) => {
  const { location } = useLocationStore();
  const lat = params.lat ?? location?.lat;
  const lng = params.lng ?? location?.lng;

  const { data: merchants, isLoading, error } = useQuery({
    queryKey: ['merchants', 'nearby', lat, lng, params.radius, params.categoryId],
    queryFn: () => {
      if (!lat || !lng) throw new Error('Location not available');
      return merchantsService.getNearby({ lat, lng, ...params });
    },
    enabled: !!lat && !!lng,
  });

  return {
    merchants: merchants || [],
    isLoading,
    error,
  };
};
