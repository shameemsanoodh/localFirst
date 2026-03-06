import bcrypt from 'bcryptjs';
export async function hashPasscode(passcode) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(passcode, salt);
}
export async function verifyPasscode(passcode, hashedPasscode) {
    return bcrypt.compare(passcode, hashedPasscode);
}
//# sourceMappingURL=hashPassword.js.map