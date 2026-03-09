import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const sns = new AWS.SNS();
const SNS_USER_TOPIC_ARN = process.env.SNS_USER_TOPIC_ARN || '';
const SNS_MERCHANT_TOPIC_ARN = process.env.SNS_MERCHANT_TOPIC_ARN || '';

// POST /admin/notifications - Send broadcast notification
export const sendNotification: APIGatewayProxyHandler = async (event) => {
  console.log('Send notification request received');

  try {
    const body = JSON.parse(event.body || '{}');
    const { audience, title, message, city } = body;

    if (!audience || !title || !message) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Audience, title, and message are required' }),
      };
    }

    if (message.length > 160) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Message must be 160 characters or less' }),
      };
    }

    let topicArn = '';
    let targetDescription = '';

    switch (audience) {
      case 'all_users':
        topicArn = SNS_USER_TOPIC_ARN;
        targetDescription = 'all users';
        break;
      case 'all_merchants':
        topicArn = SNS_MERCHANT_TOPIC_ARN;
        targetDescription = 'all merchants';
        break;
      case 'city':
        if (!city) {
          return {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: 'City is required for city-specific notifications' }),
          };
        }
        // For city-specific, we'd need a different approach (filter by city in app)
        // For now, send to all users with city filter attribute
        topicArn = SNS_USER_TOPIC_ARN;
        targetDescription = `users in ${city}`;
        break;
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({ error: 'Invalid audience' }),
        };
    }

    if (!topicArn) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'SNS topic not configured' }),
      };
    }

    const snsMessage = {
      default: message,
      GCM: JSON.stringify({
        notification: {
          title,
          body: message,
        },
        data: {
          city: city || 'all',
        },
      }),
    };

    await sns.publish({
      TopicArn: topicArn,
      Message: JSON.stringify(snsMessage),
      MessageStructure: 'json',
      Subject: title,
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: true,
        message: `Notification sent to ${targetDescription}`,
      }),
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
