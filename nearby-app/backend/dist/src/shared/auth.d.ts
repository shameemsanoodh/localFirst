export interface TokenPayload {
    userId: string;
    email: string;
    roles: string[];
}
export declare const auth: {
    hashPassword: (password: string) => Promise<string>;
    comparePassword: (password: string, hash: string) => Promise<boolean>;
    generateToken: (payload: TokenPayload) => string;
    generateRefreshToken: (payload: TokenPayload) => string;
    verifyToken: (token: string) => TokenPayload;
    extractToken: (authHeader?: string) => string | null;
};
//# sourceMappingURL=auth.d.ts.map