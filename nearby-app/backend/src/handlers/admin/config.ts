import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CONFIG_TABLE = process.env.CONFIG_TABLE || 'nearby-backend-prod-config';

// GET /admin/config - Get all config values
export const getConfig = async (event: any) => {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: CONFIG_TABLE
    }));

    const config: Record<string, any> = {};
    result.Items?.forEach(item => {
      config[item.configKey] = item.value;
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        config
      })
    };
  } catch (error) {
    console.error('Error getting config:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to get config'
      })
    };
  }
};

// PATCH /admin/config - Update config values
export const updateConfig = async (event: any) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { configKey, value } = body;

    if (!configKey || value === undefined) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'configKey and value are required'
        })
      };
    }

    await docClient.send(new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        configKey,
        value,
        updatedAt: new Date().toISOString()
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Config updated successfully'
      })
    };
  } catch (error) {
    console.error('Error updating config:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to update config'
      })
    };
  }
};
