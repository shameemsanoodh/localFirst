import bcrypt from 'bcryptjs'

export async function hashPasscode(passcode: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(passcode, salt)
}

export async function verifyPasscode(
  passcode: string, 
  hashedPasscode: string
): Promise<boolean> {
  return bcrypt.compare(passcode, hashedPasscode)
}
