import { useQuery } from '@tanstack/react-query';
import { merchantsService } from '@/services/merchants.service';

export const useMerchantProfile = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant', 'profile'],
    queryFn: () => merchantsService.getProfile(),
  });

  return {
    merchant: data,
    isLoading,
    error,
  };
};
