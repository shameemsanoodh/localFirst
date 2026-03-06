import AWS from 'aws-sdk';
const dynamodb = new AWS.DynamoDB.DocumentClient();
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
// List all merchants
export const listMerchants = async (event) => {
    console.log('List merchants request received');
    try {
        const result = await dynamodb.scan({
            TableName: MERCHANTS_TABLE,
        }).promise();
        const merchants = result.Items || [];
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(merchants),
        };
    }
    catch (error) {
        console.error('Error listing merchants:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to list merchants',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
// Suspend merchant
export const suspendMerchant = async (event) => {
    const merchantId = event.pathParameters?.merchantId;
    if (!merchantId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: 'Merchant ID is required' }),
        };
    }
    try {
        await dynamodb.update({
            TableName: MERCHANTS_TABLE,
            Key: { merchantId },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'suspended',
                ':updatedAt': new Date().toISOString(),
            },
        }).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ success: true, message: 'Merchant suspended' }),
        };
    }
    catch (error) {
        console.error('Error suspending merchant:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to suspend merchant',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
// Activate merchant
export const activateMerchant = async (event) => {
    const merchantId = event.pathParameters?.merchantId;
    if (!merchantId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: 'Merchant ID is required' }),
        };
    }
    try {
        await dynamodb.update({
            TableName: MERCHANTS_TABLE,
            Key: { merchantId },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'active',
                ':updatedAt': new Date().toISOString(),
            },
        }).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ success: true, message: 'Merchant activated' }),
        };
    }
    catch (error) {
        console.error('Error activating merchant:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to activate merchant',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
// Delete merchant
export const deleteMerchant = async (event) => {
    const merchantId = event.pathParameters?.merchantId;
    if (!merchantId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: 'Merchant ID is required' }),
        };
    }
    try {
        await dynamodb.delete({
            TableName: MERCHANTS_TABLE,
            Key: { merchantId },
        }).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ success: true, message: 'Merchant deleted' }),
        };
    }
    catch (error) {
        console.error('Error deleting merchant:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to delete merchant',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
//# sourceMappingURL=merchants.js.map