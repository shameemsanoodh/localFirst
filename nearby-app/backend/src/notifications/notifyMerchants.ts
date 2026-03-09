import { EventBridgeHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const MERCHANT_DEVICES_TABLE = process.env.MERCHANT_DEVICES_TABLE!;

interface BroadcastCreatedEvent {
  broadcastId: string;
  merchantIds: string[];
  query: string;
  category?: string;
  location: { lat: number; lng: number };
  radiusKm: number;
  budget?: number;
}

export const handler: EventBridgeHandler<'BroadcastCreated', BroadcastCreatedEvent, void> = async (event) => {
  console.log('Processing BroadcastCreated event:', JSON.stringify(event));
  
  const { broadcastId, merchantIds, query, category, budget } = event.detail;

  // Batch process merchants (max 100 at a time to avoid Lambda timeout)
  const batchSize = 100;
  for (let i = 0; i < merchantIds.length; i += batchSize) {
    const batch = merchantIds.slice(i, i + batchSize);
    await Promise.all(batch.map(merchantId => notifyMerchant(merchantId, {
      broadcastId,
      query,
      category,
      budget
    })));
  }

  console.log(`Notified ${merchantIds.length} merchants`);
};

async function notifyMerchant(
  merchantId: string,
  data: { broadcastId: string; query: string; category?: string; budget?: number }
) {
  try {
    // Get all active devices for this merchant
    const result = await docClient.send(new QueryCommand({
      TableName: MERCHANT_DEVICES_TABLE,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: 'isActive = :true',
      ExpressionAttributeValues: {
        ':pk': `MERCHANT#${merchantId}`,
        ':true': true
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      console.log(`No active devices for merchant ${merchantId}`);
      return;
    }

    // Send push notification to each device
    const notifications = result.Items.map(device => 
      sendPushNotification(device.endpointArn, {
        title: '🔔 New Customer Request',
        body: data.budget 
          ? `"${data.query}" under ₹${data.budget}`
          : `"${data.query}"`,
        data: {
          type: 'broadcast',
          broadcastId: data.broadcastId,
          category: data.category || '',
          action: 'open_broadcast'
        }
      })
    );

    await Promise.allSettled(notifications);
    console.log(`Sent ${notifications.length} notifications for merchant ${merchantId}`);

  } catch (error) {
    console.error(`Error notifying merchant ${merchantId}:`, error);
    // Don't throw - continue with other merchants
  }
}

async function sendPushNotification(
  endpointArn: string,
  payload: { title: string; body: string; data: Record<string, string> }
) {
  try {
    // Format for both FCM and APNs
    const message = {
      default: payload.body,
      GCM: JSON.stringify({
        notification: {
          title: payload.title,
          body: payload.body,
          sound: 'default'
        },
        data: payload.data
      }),
      APNS: JSON.stringify({
        aps: {
          alert: {
            title: payload.title,
            body: payload.body
          },
          sound: 'default',
          badge: 1
        },
        data: payload.data
      }),
      APNS_SANDBOX: JSON.stringify({
        aps: {
          alert: {
            title: payload.title,
            body: payload.body
          },
          sound: 'default',
          badge: 1
        },
        data: payload.data
      })
    };

    await snsClient.send(new PublishCommand({
      TargetArn: endpointArn,
      Message: JSON.stringify(message),
      MessageStructure: 'json'
    }));

    console.log(`Push notification sent to ${endpointArn}`);

  } catch (error: any) {
    console.error(`Failed to send push to ${endpointArn}:`, error);
    
    // Handle invalid/expired tokens
    if (error.code === 'EndpointDisabled' || error.code === 'InvalidParameter') {
      console.log(`Endpoint ${endpointArn} is invalid, should be cleaned up`);
      // TODO: Mark device as inactive in DynamoDB
    }
  }
}
