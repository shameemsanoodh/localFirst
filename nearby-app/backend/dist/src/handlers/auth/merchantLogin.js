import AWS from 'aws-sdk';
const { DynamoDB } = AWS;
import { verifyPasscode } from '../../utils/hashPassword.js';
import { generateToken } from '../../utils/jwt.js';
const dynamodb = new DynamoDB.DocumentClient();
const MERCHANTS_TABLE = process.env.DYNAMODB_MERCHANTS_TABLE || 'nearby-merchants';
export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { identifier, passcode } = body;
        if (!identifier || !passcode) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'Merchant ID/Email and passcode are required' })
            };
        }
        // Determine if identifier is email or merchantId
        const isEmail = identifier.includes('@');
        let merchant = null;
        if (isEmail) {
            // Scan by email since GSI doesn't exist natively yet
            const result = await dynamodb.scan({
                TableName: MERCHANTS_TABLE,
                FilterExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': identifier
                }
            }).promise();
            if (result.Items && result.Items.length > 0) {
                merchant = result.Items[0];
            }
        }
        else {
            // Query by merchantId (primary key)
            const result = await dynamodb.get({
                TableName: MERCHANTS_TABLE,
                Key: { merchantId: identifier }
            }).promise();
            merchant = result.Item;
        }
        if (!merchant) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'Invalid Merchant ID/Email or passcode' })
            };
        }
        // Verify passcode
        const isValidPasscode = await verifyPasscode(passcode, merchant.passcode);
        if (!isValidPasscode) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'Invalid Merchant ID/Email or passcode' })
            };
        }
        // Update last login time
        await dynamodb.update({
            TableName: MERCHANTS_TABLE,
            Key: { merchantId: merchant.merchantId },
            UpdateExpression: 'SET lastLoginAt = :now',
            ExpressionAttributeValues: {
                ':now': new Date().toISOString()
            }
        }).promise();
        // Generate JWT token
        const token = generateToken({
            merchantId: merchant.merchantId,
            email: merchant.email,
            role: 'merchant',
            phone: merchant.phone
        });
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                success: true,
                token,
                merchant: {
                    merchantId: merchant.merchantId,
                    shopName: merchant.shopName,
                    email: merchant.email,
                    phone: merchant.phone,
                    ownerName: merchant.ownerName,
                    majorCategory: merchant.majorCategory,
                    subCategory: merchant.subCategory,
                    capabilities: merchant.capabilities,
                    isOpen: merchant.isOpen,
                    onboardingCompleted: merchant.onboardingCompleted || false
                }
            })
        };
    }
    catch (error) {
        console.error('Error in merchant login:', error);
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
//# sourceMappingURL=merchantLogin.js.map