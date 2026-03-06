import AWS from 'aws-sdk';
const { DynamoDB } = AWS;
import { verifyToken } from '../../utils/jwt';
const dynamodb = new DynamoDB.DocumentClient();
const PRODUCTS_TABLE = process.env.DYNAMODB_PRODUCTS_TABLE || 'nearby-products';
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
        // Query products by merchantId using GSI
        const result = await dynamodb.query({
            TableName: PRODUCTS_TABLE,
            IndexName: 'merchantId-index',
            KeyConditionExpression: 'merchantId = :merchantId',
            ExpressionAttributeValues: {
                ':merchantId': decoded.merchantId
            }
        }).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ products: result.Items || [] })
        };
    }
    catch (error) {
        console.error('Error listing products:', error);
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
//# sourceMappingURL=listProducts.js.map