import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
const dynamodb = new AWS.DynamoDB.DocumentClient();
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
/**
 * Merchant Products CRUD handler
 * GET    /merchant/products          — list products
 * POST   /merchant/products          — add product
 * PUT    /merchant/products/{id}     — update product
 * DELETE /merchant/products/{id}     — delete product
 */
export const handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
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
                body: JSON.stringify({ error: 'Unauthorized - merchantId not found' }),
            };
        }
        const method = event.httpMethod;
        const productId = event.pathParameters?.productId;
        if (method === 'GET') {
            return await listProducts(merchantId, headers);
        }
        else if (method === 'POST') {
            const body = JSON.parse(event.body || '{}');
            return await addProduct(merchantId, body, headers);
        }
        else if (method === 'PUT' && productId) {
            const body = JSON.parse(event.body || '{}');
            return await updateProduct(merchantId, productId, body, headers);
        }
        else if (method === 'DELETE' && productId) {
            return await deleteProduct(merchantId, productId, headers);
        }
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
    catch (error) {
        console.error('MerchantProducts error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
async function listProducts(merchantId, headers) {
    // Get merchant record and return products array
    const result = await dynamodb.get({
        TableName: MERCHANTS_TABLE,
        Key: { merchantId },
        ProjectionExpression: 'products',
    }).promise();
    const products = result.Item?.products || [];
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            data: { products, total: products.length },
        }),
    };
}
async function addProduct(merchantId, body, headers) {
    const product = {
        productId: `PROD_${uuidv4().substring(0, 8).toUpperCase()}`,
        name: body.name || 'Untitled',
        category: body.category || 'General',
        price: body.price || 0,
        stock: body.stock ?? 10,
        status: body.stock === 0 ? 'out_of_stock' : body.stock <= 5 ? 'low_stock' : 'in_stock',
        description: body.description || '',
        image: body.image || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    // Append to merchant's products array
    await dynamodb.update({
        TableName: MERCHANTS_TABLE,
        Key: { merchantId },
        UpdateExpression: 'SET products = list_append(if_not_exists(products, :empty), :product)',
        ExpressionAttributeValues: {
            ':empty': [],
            ':product': [product],
        },
    }).promise();
    return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, data: { product } }),
    };
}
async function updateProduct(merchantId, productId, body, headers) {
    // Get current products
    const result = await dynamodb.get({
        TableName: MERCHANTS_TABLE,
        Key: { merchantId },
        ProjectionExpression: 'products',
    }).promise();
    const products = result.Item?.products || [];
    const idx = products.findIndex(p => p.productId === productId);
    if (idx === -1) {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Product not found' }),
        };
    }
    // Update fields
    const updated = {
        ...products[idx],
        ...body,
        productId, // prevent overwriting ID
        updatedAt: Date.now(),
        status: (body.stock ?? products[idx].stock) === 0 ? 'out_of_stock'
            : (body.stock ?? products[idx].stock) <= 5 ? 'low_stock' : 'in_stock',
    };
    products[idx] = updated;
    await dynamodb.update({
        TableName: MERCHANTS_TABLE,
        Key: { merchantId },
        UpdateExpression: 'SET products = :products',
        ExpressionAttributeValues: { ':products': products },
    }).promise();
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: { product: updated } }),
    };
}
async function deleteProduct(merchantId, productId, headers) {
    const result = await dynamodb.get({
        TableName: MERCHANTS_TABLE,
        Key: { merchantId },
        ProjectionExpression: 'products',
    }).promise();
    const products = result.Item?.products || [];
    const filtered = products.filter(p => p.productId !== productId);
    if (filtered.length === products.length) {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Product not found' }),
        };
    }
    await dynamodb.update({
        TableName: MERCHANTS_TABLE,
        Key: { merchantId },
        UpdateExpression: 'SET products = :products',
        ExpressionAttributeValues: { ':products': filtered },
    }).promise();
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Product deleted' }),
    };
}
//# sourceMappingURL=merchantProducts.js.map