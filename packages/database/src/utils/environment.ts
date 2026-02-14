/**
 * Retrieves a required environment variable value.
 *
 * @param name - The name of the environment variable to retrieve
 * @returns The value of the environment variable as a string
 * @throws {Error} If the environment variable name is invalid (not a string or empty)
 * @throws {Error} If the environment variable is not set or is an empty string
 *
 * @example
 * ```typescript
 * const apiKey = requireEnv('API_KEY');
 * // Returns the value of API_KEY environment variable
 * ```
 */
export const requireEnv = (name: string): string => {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('Invalid environment variable name');
  }

  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

/**
 * Retrieves an optional environment variable value.
 *
 * @param name - The name of the environment variable to retrieve
 * @returns The value of the environment variable as a string, or undefined if not set
 */
export const optionalEnv = (name: string): string | undefined => {
  const value = process.env[name];
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return undefined;
};

/**
 * Retrieves a required environment variable value as a non-negative integer.
 *
 * @param name - The name of the environment variable to retrieve
 * @returns The value of the environment variable as a non-negative integer
 * @throws {Error} If the environment variable name is invalid (not a string or empty)
 * @throws {Error} If the environment variable is not set, is an empty string, or is not a valid non-negative integer
 *
 * @example
 * ```typescript
 * const port = requireIntEnv('APP_PORT');
 * // Returns the value of APP_PORT environment variable as a number
 * ```
 */
export const requireIntEnv = (name: string): number => {
  const raw = requireEnv(name);

  if (raw.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }

  return value;
};

/**
 * Parse database URL in the format: mysql://user:password@host:port/database
 * Common in production environments (Heroku, Railway, etc.)
 */
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const parseDatabaseUrl = (url: string): DatabaseConfig => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
    const user = parsed.username;
    const password = decodeURIComponent(parsed.password);
    const database = parsed.pathname.slice(1); // Remove leading slash

    if (!host || !user || !database) {
      throw new Error('Invalid database URL format');
    }

    return {host, port, user, password, database};
  } catch (error) {
    throw new Error(
      `Failed to parse database URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

// Check for database URL (common in production)
const databaseUrl = optionalEnv('DATABASE_URL') || optionalEnv('JAWSDB_URL');
const dbConfig = databaseUrl ? parseDatabaseUrl(databaseUrl) : null;

export const NODE_ENV = requireEnv('NODE_ENV');
export const DB_HOST = dbConfig?.host ?? requireEnv('DB_HOST');
export const DB_NAME = dbConfig?.database ?? requireEnv('DB_NAME');
export const DB_USER = dbConfig?.user ?? requireEnv('DB_USER');
export const DB_PASSWORD = dbConfig?.password ?? requireEnv('DB_PASSWORD');
export const DB_PORT = dbConfig?.port ?? requireIntEnv('DB_PORT');
// DB_ROOT_PASSWORD is only needed for local Docker setup, not required in production
export const DB_ROOT_PASSWORD = optionalEnv('DB_ROOT_PASSWORD') ?? '';
export const PWD_PEPPER = requireEnv('PWD_PEPPER');
export const APP_PORT = requireIntEnv('APP_PORT');
export const ARGON2ID_MEMORY = (() => {
  const memory = requireIntEnv('ARGON2ID_MEMORY');
  if (memory < 65536 || memory > 1048576) {
    throw new Error('ARGON2ID_MEMORY must be between 65536 and 1048576');
  }
  return memory;
})();

export const ARGON2ID_TIME = (() => {
  const time = requireIntEnv('ARGON2ID_TIME');
  if (time < 1 || time > 10) {
    throw new Error('ARGON2ID_TIME must be between 1 and 10');
  }
  return time;
})();
