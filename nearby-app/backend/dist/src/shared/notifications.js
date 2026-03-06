import { SNSClient, PublishCommand, SubscribeCommand } from '@aws-sdk/client-sns';
const REGION = process.env.AWS_REGION || 'ap-south-1';
const ORDER_STATUS_TOPIC_ARN = process.env.ORDER_STATUS_UPDATES_TOPIC_ARN || '';
const USER_TOPIC_ARN = process.env.SNS_USER_TOPIC_ARN || '';
const MERCHANT_TOPIC_ARN = process.env.SNS_MERCHANT_TOPIC_ARN || '';
const client = new SNSClient({ region: REGION });
export const notifications = {
    /**
     * Send a notification about order status changes
     */
    sendOrderStatusUpdate: async (payload) => {
        if (!ORDER_STATUS_TOPIC_ARN) {
            console.warn('SNS ORDER_STATUS_UPDATES_TOPIC_ARN not configured, skipping notification');
            return null;
        }
        try {
            const command = new PublishCommand({
                TopicArn: ORDER_STATUS_TOPIC_ARN,
                Subject: payload.title,
                Message: JSON.stringify({
                    type: payload.type,
                    title: payload.title,
                    message: payload.message,
                    userId: payload.userId,
                    merchantId: payload.merchantId,
                    orderId: payload.orderId,
                    timestamp: new Date().toISOString(),
                    data: payload.data,
                }),
                MessageAttributes: {
                    type: {
                        DataType: 'String',
                        StringValue: payload.type,
                    },
                },
            });
            const result = await client.send(command);
            console.log('SNS notification sent:', result.MessageId);
            return result.MessageId;
        }
        catch (error) {
            console.error('SNS sendOrderStatusUpdate error:', error);
            return null;
        }
    },
    /**
     * Send notification to users (e.g. nearby offers, broadcast responses)
     */
    notifyUser: async (payload) => {
        const topicArn = USER_TOPIC_ARN || ORDER_STATUS_TOPIC_ARN;
        if (!topicArn) {
            console.warn('No user SNS topic configured, skipping notification');
            return null;
        }
        try {
            const command = new PublishCommand({
                TopicArn: topicArn,
                Subject: payload.title,
                Message: JSON.stringify({
                    type: payload.type,
                    ...payload,
                    timestamp: new Date().toISOString(),
                }),
                MessageAttributes: {
                    type: { DataType: 'String', StringValue: payload.type },
                    target: { DataType: 'String', StringValue: 'user' },
                },
            });
            const result = await client.send(command);
            return result.MessageId;
        }
        catch (error) {
            console.error('SNS notifyUser error:', error);
            return null;
        }
    },
    /**
     * Send notification to merchants (e.g. new broadcasts, orders)
     */
    notifyMerchant: async (payload) => {
        const topicArn = MERCHANT_TOPIC_ARN || ORDER_STATUS_TOPIC_ARN;
        if (!topicArn) {
            console.warn('No merchant SNS topic configured, skipping notification');
            return null;
        }
        try {
            const command = new PublishCommand({
                TopicArn: topicArn,
                Subject: payload.title,
                Message: JSON.stringify({
                    type: payload.type,
                    ...payload,
                    timestamp: new Date().toISOString(),
                }),
                MessageAttributes: {
                    type: { DataType: 'String', StringValue: payload.type },
                    target: { DataType: 'String', StringValue: 'merchant' },
                },
            });
            const result = await client.send(command);
            return result.MessageId;
        }
        catch (error) {
            console.error('SNS notifyMerchant error:', error);
            return null;
        }
    },
    /**
     * Subscribe an email/phone endpoint to a topic
     */
    subscribe: async (topicArn, protocol, endpoint) => {
        try {
            const command = new SubscribeCommand({
                TopicArn: topicArn,
                Protocol: protocol,
                Endpoint: endpoint,
            });
            const result = await client.send(command);
            return result.SubscriptionArn;
        }
        catch (error) {
            console.error('SNS subscribe error:', error);
            return null;
        }
    },
};
//# sourceMappingURL=notifications.js.map