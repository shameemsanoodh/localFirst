import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, CreatePlatformEndpointCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const MERCHANT_DEVICES_TABLE = process.env.MERCHANT_DEVICES_TABLE!;
const USER_DEVICES_TABLE = process.env.USER_DEVICES_TABLE!;
const FCM_PLATFORM_ARN = process.env.FCM_PLATFORM_ARN!;
const APNS_PLATFORM_ARN = process.env.APNS_PLATFORM_ARN!;

interface RegisterDeviceRequest {
  userId?: string;
  merchantId?: string;
  deviceId: string;
  platform: 'android' | 'ios';
  pushToken: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Registering device:', event.body);
  
  try {
    const body: RegisterDeviceRequest = JSON.parse(event.body || '{}');
    
    // Validate input
    if (!body.deviceId || !body.platform || !body.pushToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    if (!body.userId && !body.merchantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Either userId or merchantId required' })
      };
    }

    // Create SNS Platform Endpoint
    const platformArn = body.platform === 'android' ? FCM_PLATFORM_ARN : APNS_PLATFORM_ARN;
    
    const endpointResult = await snsClient.send(new CreatePlatformEndpointCommand({
      PlatformApplicationArn: platformArn,
      Token: body.pushToken,
      CustomUserData: body.merchantId || body.userId
    }));

    const endpointArn = endpointResult.EndpointArn!;
    console.log('Created SNS endpoint:', endpointArn);

    // Save to DynamoDB
    const now = Date.now();
    const tableName = body.merchantId ? MERCHANT_DEVICES_TABLE : USER_DEVICES_TABLE;
    const pk = body.merchantId ? `MERCHANT#${body.merchantId}` : `USER#${body.userId}`;

    const device = {
      PK: pk,
      SK: `DEVICE#${body.deviceId}`,
      merchantId: body.merchantId,
      userId: body.userId,
      deviceId: body.deviceId,
      platform: body.platform,
      pushToken: body.pushToken,
      endpointArn,
      isActive: true,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: device
    }));

    console.log('Device registered successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        deviceId: body.deviceId,
        endpointArn,
        status: 'registered'
      })
    };

  } catch (error: any) {
    console.error('Error registering device:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to register device', details: error.message })
    };
  }
};
