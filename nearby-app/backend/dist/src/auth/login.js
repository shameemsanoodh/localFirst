import { db, Tables } from '../shared/db.js';
import { auth } from '../shared/auth.js';
import { cognito } from '../shared/cognito.js';
import { response } from '../shared/response.js';
export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { email, password } = body;
        if (!email || !password) {
            return response.error('Email and password are required', 400, 'INVALID_INPUT');
        }
        // 1. Find user in DynamoDB (our source of truth for user data)
        const allUsers = await db.scan(Tables.USERS);
        const user = allUsers.find((u) => u.email === email);
        if (!user) {
            return response.error('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }
        // 2. Try Cognito authentication first (if configured)
        let cognitoTokens = null;
        if (cognito.isConfigured()) {
            try {
                cognitoTokens = await cognito.signIn(email, password);
                if (cognitoTokens) {
                    console.log('Cognito auth succeeded for:', email);
                }
            }
            catch (cognitoErr) {
                console.warn('Cognito auth failed, falling back to custom JWT:', cognitoErr.message);
            }
        }
        // 3. If Cognito didn't authenticate, verify password locally
        if (!cognitoTokens) {
            const isValidPassword = await auth.comparePassword(password, user.password);
            if (!isValidPassword) {
                return response.error('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            }
        }
        // 4. Generate our JWT tokens (always — these are what the frontend uses)
        const tokenPayload = { userId: user.userId, email: user.email, roles: [user.role] };
        const token = auth.generateToken(tokenPayload);
        const refreshToken = auth.generateRefreshToken(tokenPayload);
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        return response.success({
            userId: user.userId,
            token,
            refreshToken,
            cognitoTokens, // Include Cognito tokens if available (for future use)
            user: userWithoutPassword,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return response.error('Login failed', 500, 'INTERNAL_ERROR');
    }
};
//# sourceMappingURL=login.js.map