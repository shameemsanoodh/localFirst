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
        const productId = event.pathParameters?.productId;
        const body = JSON.parse(event.body || '{}');
        if (!productId) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'Product ID is required' })
            };
        }
        // Verify product belongs to merchant
        const existingProduct = await dynamodb.get({
            TableName: PRODUCTS_TABLE,
            Key: { productId }
        }).promise();
        if (!existingProduct.Item || existingProduct.Item.merchantId !== decoded.merchantId) {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'Not authorized to update this product' })
            };
        }
        // Build update expression
        const allowedFields = ['name', 'description', 'price', 'stock', 'category', 'imageUrl', 'isAvailable'];
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
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        await dynamodb.update({
            TableName: PRODUCTS_TABLE,
            Key: { productId },
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
            body: JSON.stringify({ success: true, message: 'Product updated successfully' })
        };
    }
    catch (error) {
        console.error('Error updating product:', error);
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
//# sourceMappingURL=updateProduct.js.map