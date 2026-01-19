import {BCRYPT_SALT_COST, PWD_PEPPER} from './environment';

/**
 * Hashes a password using bcrypt algorithm with a pepper value.
 *
 * @param password - The plain text password to be hashed
 * @returns A promise that resolves to the hashed password string
 *
 * @remarks
 * This function uses Bun's built-in password hashing utility with bcrypt algorithm.
 * It combines the password with a pepper value (PWD_PEPPER) before hashing for additional security.
 * The cost factor is controlled by BCRYPT_SALT_COST constant, expected to be between 10 and 31.
 *
 * @example
 * ```typescript
 * const hashedPassword = await hashPassword('mySecurePassword123');
 * ```
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password + PWD_PEPPER, {
    algorithm: 'bcrypt',
    cost: BCRYPT_SALT_COST,
  });
};

/** * Verifies a plain text password against a hashed password.
 *
 * @param password - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns A promise that resolves to true if the password matches the hash, false otherwise
 *
 * @remarks
 * This function uses Bun's built-in password verification utility with bcrypt algorithm.
 * It combines the password with a pepper value (PWD_PEPPER) for additional security.
 *
 * @example
 * ```typescript
 * const isMatch = await verifyPassword('mySecurePassword123', hashedPassword);
 * ```
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await Bun.password.verify(password + PWD_PEPPER, hashedPassword);
};
