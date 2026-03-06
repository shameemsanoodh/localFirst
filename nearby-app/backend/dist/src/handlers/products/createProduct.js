import AWS from 'aws-sdk';
const { DynamoDB } = AWS;
import { v4 as uuidv4 } from 'uuid';
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
        const body = JSON.parse(event.body || '{}');
        const { name, description, price, stock, category, imageUrl } = body;
        if (!name || price === undefined || stock === undefined) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'Name, price, and stock are required' })
            };
        }
        const productId = `PROD_${uuidv4()}`;
        const timestamp = new Date().toISOString();
        const product = {
            productId,
            merchantId: decoded.merchantId,
            name,
            description: description || '',
            price: Number(price),
            stock: Number(stock),
            category: category || 'General',
            imageUrl: imageUrl || '',
            isAvailable: true,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        await dynamodb.put({
            TableName: PRODUCTS_TABLE,
            Item: product
        }).promise();
        return {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ success: true, product })
        };
    }
    catch (error) {
        console.error('Error creating product:', error);
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
//# sourceMappingURL=createProduct.js.map