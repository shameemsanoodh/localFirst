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
        // Build update expression dynamically
        const allowedFields = ['shopName', 'ownerName', 'location', 'timing', 'whatsapp', 'capabilities', 'majorCategory', 'subCategory'];
        const updateExpressions = [];
        const expressionAttributeValues = {};
        const expressionAttributeNames = {};
        Object.keys(body).forEach((key) => {
            if (allowedFields.includes(key)) {
                updateExpressions.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = body[key];
            }
        });
        if (updateExpressions.length === 0) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'No valid fields to update' })
            };
        }
        // Add updatedAt timestamp
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        await dynamodb.update({
            TableName: MERCHANTS_TABLE,
            Key: { merchantId: decoded.merchantId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        }).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ success: true, message: 'Profile updated successfully' })
        };
    }
    catch (error) {
        console.error('Error updating merchant profile:', error);
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
//# sourceMappingURL=updateProfile.js.map