import { auth } from './auth.js';
export const handler = async (event) => {
    try {
        // Allow CORS preflight OPTIONS requests to pass through
        if (event.httpMethod === 'OPTIONS') {
            return generatePolicy('anonymous', 'Allow', event.methodArn);
        }
        // For REQUEST type authorizer, the token comes in headers
        const authHeader = event.headers?.Authorization || event.headers?.authorization || '';
        const token = auth.extractToken(authHeader);
        if (!token) {
            throw new Error('No token provided');
        }
        const payload = auth.verifyToken(token);
        // Build the resource ARN for wildcard access (allow all methods on this API)
        const arnParts = event.methodArn.split(':');
        const apiGatewayArnParts = arnParts[5].split('/');
        const region = arnParts[3];
        const accountId = arnParts[4];
        const apiId = apiGatewayArnParts[0];
        const stage = apiGatewayArnParts[1];
        const resourceArn = `arn:aws:execute-api:${region}:${accountId}:${apiId}/${stage}/*/*`;
        return {
            principalId: payload.userId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: resourceArn,
                    },
                ],
            },
            context: {
                userId: payload.userId,
                merchantId: payload.userId, // merchantId is same as userId for merchants
                email: payload.email,
                roles: JSON.stringify(payload.roles),
            },
        };
    }
    catch (error) {
        console.error('Authorization failed:', error);
        throw new Error('Unauthorized');
    }
};
function generatePolicy(principalId, effect, resource) {
    const arnParts = resource.split(':');
    const apiGatewayArnParts = arnParts[5].split('/');
    const region = arnParts[3];
    const accountId = arnParts[4];
    const apiId = apiGatewayArnParts[0];
    const stage = apiGatewayArnParts[1];
    const wildcardArn = `arn:aws:execute-api:${region}:${accountId}:${apiId}/${stage}/*/*`;
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: wildcardArn,
                },
            ],
        },
    };
}
//# sourceMappingURL=authorizer.js.map