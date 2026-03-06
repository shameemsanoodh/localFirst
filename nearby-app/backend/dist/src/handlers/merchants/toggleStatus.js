import AWS from 'aws-sdk';
const { DynamoDB } = AWS;
import { verifyToken } from '../../utils/jwt';
const dynamodb = new DynamoDB.DocumentClient();
const MERCHANTS_TABLE = process.env.DYNAMODB_MERCHANTS_TABLE || 'nearby-merchants';
export const handler = async (event) => {
    try {
        const token = event.headers.Authorization?.replace('Bearer ', '');
        if (!token) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'No authorization token provided' })
            };
        }
        const decoded = verifyToken(token);
        const body = JSON.parse(event.body || '{}');
        const { isOpen } = body;
        if (typeof isOpen !== 'boolean') {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'isOpen must be a boolean' })
            };
        }
        await dynamodb.update({
            TableName: MERCHANTS_TABLE,
            Key: { merchantId: decoded.merchantId },
            UpdateExpression: 'SET isOpen = :isOpen, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':isOpen': isOpen,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                success: true,
                isOpen,
                message: `Shop is now ${isOpen ? 'open' : 'closed'}`
            })
        };
    }
    catch (error) {
        console.error('Error toggling shop status:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
//# sourceMappingURL=toggleStatus.js.map