export interface TokenPayload {
    merchantId: string;
    email: string;
    role: 'merchant' | 'customer';
    phone: string;
}
export declare function generateToken(payload: TokenPayload): string;
export declare function verifyToken(token: string): TokenPayload;
//# sourceMappingURL=jwt.d.ts.map