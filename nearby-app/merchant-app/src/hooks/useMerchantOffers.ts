import { useQuery } from '@tanstack/react-query';
import { merchantsService } from '@/services/merchants.service';

export const useMerchantOffers = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant', 'offers'],
    queryFn: () => merchantsService.getOffers(),
  });

  return {
    offers: data || [],
    isLoading,
    error,
  };
};
