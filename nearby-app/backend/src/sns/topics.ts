/**
 * SNS Topic Management
 * Handles creation and management of SNS topics for push notifications
 */

import AWS from 'aws-sdk';

const sns = new AWS.SNS({ region: process.env.AWS_REGION || 'ap-south-1' });

// Topic ARNs - these will be created if they don't exist
export const TOPICS = {
  MERCHANT_REQUESTS: process.env.SNS_MERCHANT_REQUESTS_TOPIC_ARN || '',
  CUSTOMER_RESPONSES: process.env.SNS_CUSTOMER_RESPONSES_TOPIC_ARN || '',
  DISCOUNT_BROADCASTS: process.env.SNS_DISCOUNT_BROADCASTS_TOPIC_ARN || '',
};

/**
 * Create SNS topics if they don't exist
 */
export async function ensureTopicsExist() {
  const topics = [
    { name: 'merchant-requests', description: 'User broadcasts to merchants' },
    { name: 'customer-responses', description: 'Merchant responses to users' },
    { name: 'discount-broadcasts', description: 'Merchant promotions to users' },
  ];

  const createdTopics: Record<string, string> = {};

  for (const topic of topics) {
    try {
      const result = await sns.createTopic({
        Name: topic.name,
        Attributes: {
          DisplayName: topic.description,
        },
      }).promise();

      createdTopics[topic.name] = result.TopicArn!;
      console.log(`✓ Topic created/verified: ${topic.name} → ${result.TopicArn}`);
    } catch (error) {
      console.error(`Error creating topic ${topic.name}:`, error);
    }
  }

  return createdTopics;
}

/**
 * Subscribe a device token to a topic
 */
export async function subscribeDeviceToTopic(
  topicArn: string,
  platform: 'ios' | 'android',
  deviceToken: string,
  attributes?: Record<string, string>
): Promise<string> {
  try {
    // For mobile push, we need to use Platform Application Endpoints
    // This is a simplified version - in production, you'd create platform applications first
    
    const result = await sns.subscribe({
      TopicArn: topicArn,
      Protocol: platform === 'ios' ? 'application' : 'application',
      Endpoint: deviceToken,
      Attributes: attributes,
    }).promise();

    console.log(`✓ Device subscribed to topic: ${topicArn}`);
    return result.SubscriptionArn!;
  } catch (error) {
    console.error('Error subscribing device to topic:', error);
    throw error;
  }
}

/**
 * Unsubscribe a device from a topic
 */
export async function unsubscribeDevice(subscriptionArn: string): Promise<void> {
  try {
    await sns.unsubscribe({
      SubscriptionArn: subscriptionArn,
    }).promise();

    console.log(`✓ Device unsubscribed: ${subscriptionArn}`);
  } catch (error) {
    console.error('Error unsubscribing device:', error);
    throw error;
  }
}

/**
 * Publish a message to a topic
 */
export async function publishToTopic(
  topicArn: string,
  message: any,
  subject?: string
): Promise<string> {
  try {
    // Format message for different platforms
    const messageStructure = {
      default: JSON.stringify(message),
      GCM: JSON.stringify({
        notification: {
          title: subject || 'New Notification',
          body: message.body || JSON.stringify(message),
        },
        data: message,
      }),
      APNS: JSON.stringify({
        aps: {
          alert: {
            title: subject || 'New Notification',
            body: message.body || JSON.stringify(message),
          },
          sound: 'default',
        },
        data: message,
      }),
    };

    const result = await sns.publish({
      TopicArn: topicArn,
      Message: JSON.stringify(messageStructure),
      Subject: subject,
      MessageStructure: 'json',
    }).promise();

    console.log(`✓ Message published to topic: ${topicArn} → ${result.MessageId}`);
    return result.MessageId!;
  } catch (error) {
    console.error('Error publishing to topic:', error);
    throw error;
  }
}

/**
 * Publish directly to a device endpoint (for targeted notifications)
 */
export async function publishToDevice(
  endpointArn: string,
  message: any,
  title?: string
): Promise<string> {
  try {
    const messageStructure = {
      default: JSON.stringify(message),
      GCM: JSON.stringify({
        notification: {
          title: title || 'New Notification',
          body: message.body || JSON.stringify(message),
        },
        data: message,
      }),
      APNS: JSON.stringify({
        aps: {
          alert: {
            title: title || 'New Notification',
            body: message.body || JSON.stringify(message),
          },
          sound: 'default',
        },
        data: message,
      }),
    };

    const result = await sns.publish({
      TargetArn: endpointArn,
      Message: JSON.stringify(messageStructure),
      MessageStructure: 'json',
    }).promise();

    console.log(`✓ Message sent to device: ${endpointArn} → ${result.MessageId}`);
    return result.MessageId!;
  } catch (error) {
    console.error('Error sending to device:', error);
    throw error;
  }
}
