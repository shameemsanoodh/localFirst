export type NotificationType = 'ORDER_PLACED' | 'ORDER_APPROVED' | 'ORDER_PICKED_UP' | 'ORDER_COMPLETED' | 'ORDER_CANCELLED' | 'BROADCAST_RECEIVED' | 'BROADCAST_RESPONSE' | 'NEW_OFFER' | 'CATEGORY_ADDED' | 'GENERAL';
interface NotificationPayload {
    type: NotificationType;
    title: string;
    message: string;
    userId?: string;
    merchantId?: string;
    orderId?: string;
    broadcastId?: string;
    data?: Record<string, unknown>;
}
export declare const notifications: {
    /**
     * Send a notification about order status changes
     */
    sendOrderStatusUpdate: (payload: NotificationPayload) => Promise<string>;
    /**
     * Send notification to users (e.g. nearby offers, broadcast responses)
     */
    notifyUser: (payload: NotificationPayload) => Promise<string>;
    /**
     * Send notification to merchants (e.g. new broadcasts, orders)
     */
    notifyMerchant: (payload: NotificationPayload) => Promise<string>;
    /**
     * Subscribe an email/phone endpoint to a topic
     */
    subscribe: (topicArn: string, protocol: "email" | "sms", endpoint: string) => Promise<string>;
};
export {};
//# sourceMappingURL=notifications.d.ts.map