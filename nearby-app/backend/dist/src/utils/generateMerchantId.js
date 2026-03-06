import AWS from 'aws-sdk';
const { DynamoDB } = AWS;
const dynamodb = new DynamoDB.DocumentClient();
const MERCHANTS_TABLE = process.env.DYNAMODB_MERCHANTS_TABLE || 'nearby-merchants';
export async function generateUniqueMerchantId() {
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
        // Generate SHOP + 4 random digits
        const random = Math.floor(1000 + Math.random() * 9000);
        const merchantId = `SHOP${random}`;
        // Check if exists in DynamoDB
        const result = await dynamodb.get({
            TableName: MERCHANTS_TABLE,
            Key: { merchantId }
        }).promise();
        if (!result.Item) {
            return merchantId;
        }
        attempts++;
    }
    throw new Error('Failed to generate unique merchant ID after 10 attempts');
}
//# sourceMappingURL=generateMerchantId.js.map