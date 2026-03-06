export declare const cognito: {
    isConfigured: () => boolean;
    /**
     * Sign up a new user in Cognito + auto-confirm
     */
    signUp: (email: string, password: string, name: string, phone: string) => Promise<{
        userSub: string;
        confirmed: boolean;
        alreadyExists?: undefined;
    } | {
        userSub: any;
        confirmed: boolean;
        alreadyExists: boolean;
    }>;
    /**
     * Authenticate user via Cognito (returns Cognito tokens)
     */
    signIn: (email: string, password: string) => Promise<{
        accessToken: string;
        idToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    /**
     * Get user info from Cognito
     */
    getUser: (email: string) => Promise<{
        username: string;
        status: import("@aws-sdk/client-cognito-identity-provider").UserStatusType;
        attributes: import("@aws-sdk/client-cognito-identity-provider").AttributeType[];
    }>;
    /**
     * Sign out user from Cognito (invalidates all tokens)
     */
    signOut: (accessToken: string) => Promise<boolean>;
};
//# sourceMappingURL=cognito.d.ts.map