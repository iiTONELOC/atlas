import {ARGON2ID_MEMORY, ARGON2ID_TIME, PWD_PEPPER} from './environment';

/**
 * Hashes a password using Argon2id algorithm with a pepper value.
 *
 * @param password - The plain text password to be hashed
 * @returns A promise that resolves to the hashed password string
 *
 * @remarks
 * This function uses Bun's built-in password hashing utility with Argon2id algorithm.
 * It combines the password with a pepper value (PWD_PEPPER) before hashing for additional security.
 * Parameters are controlled by ARGON2ID_* environment variables.
 *
 * @example
 * ```typescript
 * const hashedPassword = await hashPassword('mySecurePassword123');
 * ```
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password + PWD_PEPPER, {
    algorithm: 'argon2id',
    memoryCost: ARGON2ID_MEMORY,
    timeCost: ARGON2ID_TIME,
  });
};

/** * Verifies a plain text password against a hashed password.
 *
 * @param password - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns A promise that resolves to true if the password matches the hash, false otherwise
 *
 * @remarks
 * This function uses Bun's built-in password verification utility with Argon2id algorithm.
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
