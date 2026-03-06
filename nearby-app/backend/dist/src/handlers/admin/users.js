import AWS from 'aws-sdk';
const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'nearby-backend-dev-users';
// List all users
export const listUsers = async (event) => {
    console.log('List users request received');
    try {
        const result = await dynamodb.scan({
            TableName: USERS_TABLE,
        }).promise();
        const users = result.Items || [];
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(users),
        };
    }
    catch (error) {
        console.error('Error listing users:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to list users',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
// Suspend user
export const suspendUser = async (event) => {
    const userId = event.pathParameters?.userId;
    if (!userId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: 'User ID is required' }),
        };
    }
    try {
        await dynamodb.update({
            TableName: USERS_TABLE,
            Key: { userId },
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
            body: JSON.stringify({ success: true, message: 'User suspended' }),
        };
    }
    catch (error) {
        console.error('Error suspending user:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to suspend user',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
// Activate user
export const activateUser = async (event) => {
    const userId = event.pathParameters?.userId;
    if (!userId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: 'User ID is required' }),
        };
    }
    try {
        await dynamodb.update({
            TableName: USERS_TABLE,
            Key: { userId },
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
            body: JSON.stringify({ success: true, message: 'User activated' }),
        };
    }
    catch (error) {
        console.error('Error activating user:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to activate user',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
// Delete user
export const deleteUser = async (event) => {
    const userId = event.pathParameters?.userId;
    if (!userId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: 'User ID is required' }),
        };
    }
    try {
        await dynamodb.delete({
            TableName: USERS_TABLE,
            Key: { userId },
        }).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ success: true, message: 'User deleted' }),
        };
    }
    catch (error) {
        console.error('Error deleting user:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to delete user',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
//# sourceMappingURL=users.js.map