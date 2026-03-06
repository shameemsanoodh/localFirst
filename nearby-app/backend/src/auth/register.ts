import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { auth } from '../shared/auth.js';
import { cognito } from '../shared/cognito.js';
import { response } from '../shared/response.js';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: 'user' | 'merchant';
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: RegisterRequest = JSON.parse(event.body || '{}');
    const { email, password, name, phone, role = 'user' } = body;

    // Validate input
    if (!email || !password || !name || !phone) {
      return response.error('Missing required fields', 400, 'INVALID_INPUT');
    }

    // Check if user already exists in DynamoDB
    const existingUsers = await db.scan(Tables.USERS!);
    const userExists = existingUsers.some((u: any) => u.email === email);

    if (userExists) {
      return response.error('User already exists', 409, 'USER_EXISTS');
    }

    // 1. Register in Cognito (if configured)
    let cognitoSub: string | null = null;
    if (cognito.isConfigured()) {
      try {
        const cognitoResult = await cognito.signUp(email, password, name, phone);
        if (cognitoResult) {
          cognitoSub = cognitoResult.userSub || null;
          console.log('User registered in Cognito:', cognitoSub);
        }
      } catch (cognitoErr: any) {
        console.warn('Cognito registration failed, continuing with DynamoDB only:', cognitoErr.message);
      }
    }

    // 2. Create user in DynamoDB
    const userId = cognitoSub || uuidv4();
    const hashedPassword = await auth.hashPassword(password);
    const now = new Date().toISOString();

    const user = {
      userId,
      email,
      password: hashedPassword,
      name,
      phone,
      role,
      cognitoSub,
      createdAt: now,
      updatedAt: now,
    };

    await db.put(Tables.USERS!, user);

    // 3. Generate our own JWT tokens (works regardless of Cognito)
    const tokenPayload = { userId, email, roles: [role] };
    const token = auth.generateToken(tokenPayload);
    const refreshToken = auth.generateRefreshToken(tokenPayload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return response.success({
      userId,
      token,
      refreshToken,
      user: userWithoutPassword,
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return response.error('Registration failed', 500, 'INTERNAL_ERROR');
  }
};
