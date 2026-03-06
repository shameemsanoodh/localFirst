import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
export const auth = {
    hashPassword: async (password) => {
        return bcrypt.hash(password, 10);
    },
    comparePassword: async (password, hash) => {
        return bcrypt.compare(password, hash);
    },
    generateToken: (payload) => {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },
    generateRefreshToken: (payload) => {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    },
    verifyToken: (token) => {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    },
    extractToken: (authHeader) => {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    },
};
//# sourceMappingURL=auth.js.map