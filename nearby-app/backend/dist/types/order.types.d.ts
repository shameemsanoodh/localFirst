export interface Order {
    orderId: string;
    userId: string;
    merchantId: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'completed' | 'cancelled';
    deliveryAddress?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}
//# sourceMappingURL=order.types.d.ts.map