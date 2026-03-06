import AWS from 'aws-sdk';
const s3 = new AWS.S3();
const BUCKET_NAME = 'nearby-kb';
const CAPABILITIES_KEY = 'categories/ALL_MERCHANT_CAPABILITIES.json';
// Cache capabilities in memory (Lambda container reuse)
let cachedCapabilities = null;
export const handler = async (event) => {
    try {
        // Return cached data if available
        if (cachedCapabilities) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                },
                body: JSON.stringify({
                    success: true,
                    capabilities: cachedCapabilities
                })
            };
        }
        // Fetch from S3
        const result = await s3.getObject({
            Bucket: BUCKET_NAME,
            Key: CAPABILITIES_KEY
        }).promise();
        const capabilities = JSON.parse(result.Body?.toString() || '[]');
        // Cache for future requests
        cachedCapabilities = capabilities;
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
            },
            body: JSON.stringify({
                success: true,
                capabilities,
                total_categories: capabilities.length
            })
        };
    }
    catch (error) {
        console.error('Error fetching capabilities:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Failed to fetch capabilities',
                details: error.message
            })
        };
    }
};
//# sourceMappingURL=getCapabilities.js.map