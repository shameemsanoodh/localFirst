import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, AdminGetUserCommand, GlobalSignOutCommand, AdminConfirmSignUpCommand, } from '@aws-sdk/client-cognito-identity-provider';
const REGION = process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'not-configured';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || 'not-configured';
const client = new CognitoIdentityProviderClient({ region: REGION });
const isCognitoConfigured = () => USER_POOL_ID !== 'not-configured' && CLIENT_ID !== 'not-configured';
export const cognito = {
    isConfigured: isCognitoConfigured,
    /**
     * Sign up a new user in Cognito + auto-confirm
     */
    signUp: async (email, password, name, phone) => {
        if (!isCognitoConfigured())
            return null;
        try {
            const signUpCommand = new SignUpCommand({
                ClientId: CLIENT_ID,
                Username: email,
                Password: password,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'name', Value: name },
                    { Name: 'phone_number', Value: phone.startsWith('+') ? phone : `+91${phone}` },
                ],
            });
            const signUpResult = await client.send(signUpCommand);
            // Auto-confirm user (skip email verification for dev)
            try {
                const confirmCommand = new AdminConfirmSignUpCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: email,
                });
                await client.send(confirmCommand);
            }
            catch (confirmErr) {
                console.warn('Auto-confirm failed (user may already be confirmed):', confirmErr);
            }
            return {
                userSub: signUpResult.UserSub,
                confirmed: signUpResult.UserConfirmed,
            };
        }
        catch (error) {
            console.error('Cognito signUp error:', error.message);
            // If user already exists in Cognito, that's OK — we'll still use DynamoDB
            if (error.name === 'UsernameExistsException') {
                return { userSub: null, confirmed: true, alreadyExists: true };
            }
            throw error;
        }
    },
    /**
     * Authenticate user via Cognito (returns Cognito tokens)
     */
    signIn: async (email, password) => {
        if (!isCognitoConfigured())
            return null;
        try {
            const command = new InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: CLIENT_ID,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password,
                },
            });
            const result = await client.send(command);
            return {
                accessToken: result.AuthenticationResult?.AccessToken,
                idToken: result.AuthenticationResult?.IdToken,
                refreshToken: result.AuthenticationResult?.RefreshToken,
                expiresIn: result.AuthenticationResult?.ExpiresIn,
            };
        }
        catch (error) {
            console.error('Cognito signIn error:', error.message);
            // If Cognito auth fails, we fall back to custom JWT auth
            // This handles cases like NEW_PASSWORD_REQUIRED challenge
            return null;
        }
    },
    /**
     * Get user info from Cognito
     */
    getUser: async (email) => {
        if (!isCognitoConfigured())
            return null;
        try {
            const command = new AdminGetUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
            });
            const result = await client.send(command);
            return {
                username: result.Username,
                status: result.UserStatus,
                attributes: result.UserAttributes,
            };
        }
        catch (error) {
            console.error('Cognito getUser error:', error.message);
            return null;
        }
    },
    /**
     * Sign out user from Cognito (invalidates all tokens)
     */
    signOut: async (accessToken) => {
        if (!isCognitoConfigured())
            return false;
        try {
            const command = new GlobalSignOutCommand({
                AccessToken: accessToken,
            });
            await client.send(command);
            return true;
        }
        catch (error) {
            console.error('Cognito signOut error:', error.message);
            return false;
        }
    },
};
//# sourceMappingURL=cognito.js.map