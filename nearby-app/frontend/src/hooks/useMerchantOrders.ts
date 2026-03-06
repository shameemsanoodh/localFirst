import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';

export const useMerchantOrders = (status?: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant', 'orders', status],
    queryFn: () => ordersService.getMerchantOrders(status),
  });

  return {
    orders: data || [],
    isLoading,
    error,
  };
};
