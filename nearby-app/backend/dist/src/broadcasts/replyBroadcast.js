import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { notifications } from '../shared/notifications';
const dynamodb = new AWS.DynamoDB.DocumentClient();
const RESPONSES_TABLE = process.env.RESPONSES_TABLE || 'nearby-responses';
const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-broadcasts';
export const handler = async (event) => {
    try {
        const broadcast_id = event.pathParameters?.id;
        const body = JSON.parse(event.body || '{}');
        if (!broadcast_id || !body.shop_id || !body.response_type) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Missing required fields',
                    required: ['broadcast_id (in path)', 'shop_id', 'response_type']
                })
            };
        }
        // Create response record
        const response_id = `RESP_${uuidv4().substring(0, 8).toUpperCase()}`;
        const response = {
            response_id,
            broadcast_id,
            shop_id: body.shop_id,
            shop_name: body.shop_name,
            response_type: body.response_type,
            message: body.message || null,
            price: body.price || null,
            availability: body.availability || null,
            created_at: Date.now()
        };
        // Save response
        await dynamodb.put({
            TableName: RESPONSES_TABLE,
            Item: response
        }).promise();
        // Update broadcast responses count
        await dynamodb.update({
            TableName: BROADCASTS_TABLE,
            Key: { broadcast_id },
            UpdateExpression: 'SET responses_count = responses_count + :inc',
            ExpressionAttributeValues: {
                ':inc': 1
            }
        }).promise();
        // Send push notification to user about merchant response
        try {
            // Get the broadcast to find the user_id
            const broadcastResult = await dynamodb.get({
                TableName: BROADCASTS_TABLE,
                Key: { broadcast_id },
            }).promise();
            const broadcastOwner = broadcastResult.Item?.user_id;
            if (broadcastOwner) {
                const responseLabel = body.response_type === 'yes' ? 'has your item'
                    : body.response_type === 'alternative' ? 'has an alternative'
                        : 'responded';
                await notifications.notifyUser({
                    type: 'BROADCAST_RESPONSE',
                    title: `${body.shop_name} ${responseLabel}!`,
                    message: body.price ? `Price: ₹${body.price}` : (body.message || 'Check the app for details'),
                    userId: broadcastOwner,
                    broadcastId: broadcast_id,
                    data: {
                        shop_id: body.shop_id,
                        shop_name: body.shop_name,
                        response_type: body.response_type,
                        price: body.price,
                        availability: body.availability,
                    },
                });
            }
        }
        catch (notifErr) {
            console.warn('SNS notifyUser failed:', notifErr);
        }
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                response_id,
                message: 'Response recorded successfully'
            })
        };
    }
    catch (error) {
        console.error('Error replying to broadcast:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Failed to record response',
                details: error.message
            })
        };
    }
};
//# sourceMappingURL=replyBroadcast.js.map