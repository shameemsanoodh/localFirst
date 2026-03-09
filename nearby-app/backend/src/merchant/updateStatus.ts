import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
const SHOPS_TABLE = process.env.SHOPS_TABLE || 'nearby-backend-dev-shops';

export const handler: APIGatewayProxyHandler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    };

    try {
        // Get merchantId from authorizer context
        const merchantId = event.requestContext?.authorizer?.merchantId 
            || event.requestContext?.authorizer?.userId;

        if (!merchantId) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' }),
            };
        }

        const body = JSON.parse(event.body || '{}');
        const { isOpen } = body;

        if (typeof isOpen !== 'boolean') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'isOpen must be a boolean' }),
            };
        }

        // Get merchant to find shopId
        const merchantResult = await dynamodb.get({
            TableName: MERCHANTS_TABLE,
            Key: { merchantId }
        }).promise();

        const merchant = merchantResult.Item;
        if (!merchant) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Merchant not found' }),
            };
        }

        // Update merchant status
        await dynamodb.update({
            TableName: MERCHANTS_TABLE,
            Key: { merchantId },
            UpdateExpression: 'SET isOpen = :isOpen, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':isOpen': isOpen,
                ':updatedAt': Date.now()
            }
        }).promise();

        // Also update shop status if shopId exists
        if (merchant.shopId) {
            await dynamodb.update({
                TableName: SHOPS_TABLE,
                Key: { shopId: merchant.shopId },
                UpdateExpression: 'SET isOpen = :isOpen, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':isOpen': isOpen,
                    ':updatedAt': Date.now()
                }
            }).promise();
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: `Shop marked as ${isOpen ? 'open' : 'closed'}`,
                isOpen
            }),
        };
    } catch (error: any) {
        console.error('Update status error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
