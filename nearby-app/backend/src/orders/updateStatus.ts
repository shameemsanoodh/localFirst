import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
import { Order } from '../../types/order.types.js';
import { Merchant } from '../../types/merchant.types.js';

const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const topicArn = process.env.ORDER_STATUS_UPDATES_TOPIC_ARN;

const validStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'];

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.principalId;
    if (!userId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const orderId = event.pathParameters?.orderId;
    if (!orderId) {
      return response.error('Order ID is required', 400, 'INVALID_INPUT');
    }

    const body = JSON.parse(event.body || '{}');
    const { status: newStatus } = body;

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return response.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'INVALID_INPUT');
    }

    const order = await db.get(Tables.ORDERS!, { orderId }) as Order;
    if (!order) {
      return response.error('Order not found', 404, 'NOT_FOUND');
    }

    const merchant = await db.get(Tables.MERCHANTS!, { merchantId: order.merchantId }) as Merchant;
    if (!merchant) {
      return response.error('Merchant associated with this order not found', 404, 'NOT_FOUND');
    }

    // Authorization: Only the merchant who owns the order can update it.
    if (merchant.userId !== userId) {
      return response.error('Forbidden: You do not have permission to update this order.', 403, 'FORBIDDEN');
    }

    const updatedOrder = await db.update(Tables.ORDERS!, { orderId }, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    // Publish notification to SNS
    const notificationPayload = {
      orderId: updatedOrder?.orderId,
      userId: updatedOrder?.userId,
      merchantId: updatedOrder?.merchantId,
      newStatus: updatedOrder?.status,
      updatedAt: updatedOrder?.updatedAt,
    };

    const publishCommand = new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(notificationPayload),
      MessageAttributes: {
        userId: { DataType: 'String', StringValue: updatedOrder?.userId },
        merchantId: { DataType: 'String', StringValue: updatedOrder?.merchantId },
        status: { DataType: 'String', StringValue: updatedOrder?.status },
      }
    });

    await snsClient.send(publishCommand);

    return response.success({ message: 'Order status updated successfully', order: updatedOrder });

  } catch (error) {
    console.error('Update order status error:', error);
    return response.error('Failed to update order status', 500, 'INTERNAL_ERROR');
  }
};
