import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nearby-app-secret-key-change-in-production';

export const verifyAdminToken = (token: string): { valid: boolean; decoded?: any; error?: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return {
        valid: false,
        error: 'Unauthorized: Admin role required'
      };
    }

    return {
      valid: true,
      decoded
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid or expired token'
    };
  }
};

// Admin authorizer for API Gateway
export const handler = async (event: any) => {
  const token = event.headers?.Authorization?.replace('Bearer ', '') || 
                event.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return generatePolicy('user', 'Deny', event.methodArn);
  }

  const verification = verifyAdminToken(token);

  if (!verification.valid) {
    return generatePolicy('user', 'Deny', event.methodArn);
  }

  return generatePolicy(verification.decoded.email, 'Allow', event.methodArn, verification.decoded);
};

const generatePolicy = (principalId: string, effect: string, resource: string, context?: any) => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    },
    context: context || {}
  };
};
