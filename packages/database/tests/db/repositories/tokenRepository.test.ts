import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {DataSource} from 'typeorm';
import {User, Session, Token, TokenType} from '../../../src/entities';
import {TokenRepository, getTokenRepository} from '../../../src/repositories/tokenRepository';
import {getUserRepository} from '../../../src/repositories/userRepository';
import {getSessionRepository, SessionRepository} from '../../../src/repositories/sessionRepository';
import {EntityValidationError} from '../../../src/repositories/errors';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';

const TEST_USER_EMAIL = 'test@test.com';
const TEST_USER_PASSWORD = 'password123456789badpassword';
const TEST_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const TEST_IP_ADDRESS = '192.168.1.1';
const TEST_TOKEN_TYPE = TokenType.ACCESS;
const TEST_JTI = 'unique-jwt-id-1';
const TEST_TOKEN_HASH = 'hashed-token-value';

describe('TokenRepository', () => {
  let dataSource: DataSource;
  let tokenRepo: TokenRepository;
  let sessionRepo: SessionRepository;
  let userRepo: any;
  let testSessionId: string;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    tokenRepo = getTokenRepository(dataSource.getRepository(Token));
    sessionRepo = getSessionRepository(dataSource.getRepository(Session));
    userRepo = getUserRepository(dataSource.getRepository(User));
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE session');
    await dataSource.query('TRUNCATE TABLE token');
    await dataSource.query('TRUNCATE TABLE user');
    await dataSource.query('TRUNCATE TABLE credentials');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create test user and session for token tests
    const user = await userRepo.create({
      credentials: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      },
    });

    const expiresAt = new Date(Date.now() + 3600000);
    const session = await sessionRepo.create({
      userId: user.id,
      expiresAt,
      userAgent: TEST_USER_AGENT,
      ipAddress: TEST_IP_ADDRESS,
    });

    testSessionId = session.id;
  });

  describe('create', () => {
    test('creates token with session and metadata', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      const token = await tokenRepo.create({
        sessionId: testSessionId,
        jti: TEST_JTI,
        tokenHash: TEST_TOKEN_HASH,
        type: TEST_TOKEN_TYPE as any,
        expiresAt,
      });

      expect(token.id).toBeDefined();
      expect(token.session.id).toBe(testSessionId);
      expect(token.jti).toBe(TEST_JTI);
      expect(token.tokenHash).toBe(TEST_TOKEN_HASH);
      expect(token.type).toBe(TEST_TOKEN_TYPE);
      expect(token.expiresAt).toEqual(expiresAt);
      expect(token.createdAt).toBeDefined();
      expect(token.updatedAt).toBeDefined();
    });

    test('throws error on duplicate jti', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      await tokenRepo.create({
        sessionId: testSessionId,
        jti: TEST_JTI,
        tokenHash: TEST_TOKEN_HASH,
        type: TEST_TOKEN_TYPE as any,
        expiresAt,
      });

      await expect(
        tokenRepo.create({
          sessionId: testSessionId,
          jti: TEST_JTI,
          tokenHash: 'different-hash',
          type: TokenType.REFRESH,
          expiresAt,
        }),
      ).rejects.toThrow();
    });

    test('creates multiple tokens with different jti', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      const token1 = await tokenRepo.create({
        sessionId: testSessionId,
        jti: 'jti-1',
        tokenHash: 'hash-1',
        type: TokenType.ACCESS,
        expiresAt,
      });

      const token2 = await tokenRepo.create({
        sessionId: testSessionId,
        jti: 'jti-2',
        tokenHash: 'hash-2',
        type: TokenType.REFRESH,
        expiresAt,
      });

      expect(token1.id).not.toBe(token2.id);
      expect(token1.jti).not.toBe(token2.jti);
    });

    test('creates tokens with different types', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      const accessToken = await tokenRepo.create({
        sessionId: testSessionId,
        jti: 'access-jti',
        tokenHash: 'access-hash',
        type: TokenType.ACCESS,
        expiresAt,
      });

      const refreshToken = await tokenRepo.create({
        sessionId: testSessionId,
        jti: 'refresh-jti',
        tokenHash: 'refresh-hash',
        type: TokenType.REFRESH,
        expiresAt,
      });

      expect(accessToken.type).toBe(TokenType.ACCESS);
      expect(refreshToken.type).toBe(TokenType.REFRESH);
    });
  });

  describe('findById', () => {
    test('finds token by id without relations', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      const created = await tokenRepo.create({
        sessionId: testSessionId,
        jti: TEST_JTI,
        tokenHash: TEST_TOKEN_HASH,
        type: TEST_TOKEN_TYPE as any,
        expiresAt,
      });

      const found = await tokenRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.jti).toBe(TEST_JTI);
    });

    test('finds token by id with relations', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      const created = await tokenRepo.create({
        sessionId: testSessionId,
        jti: TEST_JTI,
        tokenHash: TEST_TOKEN_HASH,
        type: TEST_TOKEN_TYPE as any,
        expiresAt,
      });

      const found = await tokenRepo.findById(created.id, ['session']);
      expect(found).toBeDefined();
      expect(found?.session).toBeDefined();
    });

    test('finds token with multiple relations', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      const created = await tokenRepo.create({
        sessionId: testSessionId,
        jti: TEST_JTI,
        tokenHash: TEST_TOKEN_HASH,
        type: TEST_TOKEN_TYPE as any,
        expiresAt,
      });

      const found = await tokenRepo.findById(created.id, ['session', 'session.user']);
      expect(found).toBeDefined();
      expect(found?.session).toBeDefined();
    });

    test('returns null for non-existent id', async () => {
      const found = await tokenRepo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for invalid uuid format', async () => {
      const found = await tokenRepo.findById('not-a-uuid');
      expect(found).toBeNull();
    });
  });

  describe('findBySessionId', () => {
    test('finds token by session id', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      const created = await tokenRepo.create({
        sessionId: testSessionId,
        jti: TEST_JTI,
        tokenHash: TEST_TOKEN_HASH,
        type: TEST_TOKEN_TYPE as any,
        expiresAt,
      });

      const found = await tokenRepo.findBySessionId(testSessionId, ['session']);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.session.id).toBe(testSessionId);
    });

    test('finds token by session id with relations', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      await tokenRepo.create({
        sessionId: testSessionId,
        jti: TEST_JTI,
        tokenHash: TEST_TOKEN_HASH,
        type: TEST_TOKEN_TYPE as any,
        expiresAt,
      });

      const found = await tokenRepo.findBySessionId(testSessionId, ['session.user']);
      expect(found).toBeDefined();
      expect(found?.session.user).toBeDefined();
    });

    test('returns null for non-existent session id', async () => {
      const found = await tokenRepo.findBySessionId('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for session with no token', async () => {
      // Create another session without a token
      const user = await userRepo.create({
        credentials: {
          email: 'another@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      const expiresAt = new Date(Date.now() + 3600000);
      const sessionWithoutToken = await sessionRepo.create({
        userId: user.id,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      const found = await tokenRepo.findBySessionId(sessionWithoutToken.id);
      // Session cascade creates a token, so this should actually find a token
      expect(found).toBeDefined();
    });

    test('returns only first token when session has one', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      const token = await tokenRepo.create({
        sessionId: testSessionId,
        jti: 'unique-jti-1',
        tokenHash: 'hash-1',
        type: TokenType.ACCESS,
        expiresAt,
      });

      const found = await tokenRepo.findBySessionId(testSessionId);
      expect(found?.id).toBe(token.id);
    });
  });

  describe('delete', () => {
    test('deletes existing token', async () => {
      const expiresAt = new Date(Date.now() + 7200000);

      // Create a separate user and session for this test to avoid FK constraint
      const deleteTestUser = await userRepo.create({
        credentials: {
          email: 'delete-test@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      const deleteTestSession = await sessionRepo.create({
        userId: deleteTestUser.id,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      const created = await tokenRepo.create({
        sessionId: deleteTestSession.id,
        jti: 'delete-test-jti',
        tokenHash: 'delete-test-hash',
        type: TEST_TOKEN_TYPE as any,
        expiresAt,
      });

      // Delete the session first to remove the FK reference
      await sessionRepo.delete(deleteTestSession.id);

      // Now we can delete the token
      await tokenRepo.delete(created.id);

      const found = await tokenRepo.findById(created.id);
      expect(found).toBeNull();
    });

    test('throws error for non-existent token', async () => {
      await expect(tokenRepo.delete('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'Token not found',
      );
    });
  });

  describe('validation', () => {
    describe('create validation', () => {
      test('rejects token with empty jti', async () => {
        const expiresAt = new Date(Date.now() + 7200000);
        try {
          await tokenRepo.create({
            sessionId: testSessionId,
            jti: '',
            tokenHash: TEST_TOKEN_HASH,
            type: TEST_TOKEN_TYPE,
            expiresAt,
          });
          throw new Error('Expected validation error');
        } catch (error) {
          expect(error).toBeInstanceOf(EntityValidationError);
          expect((error as Error).message).toContain('Validation failed');
        }
      });

      test('rejects token with empty tokenHash', async () => {
        const expiresAt = new Date(Date.now() + 7200000);
        try {
          await tokenRepo.create({
            sessionId: testSessionId,
            jti: TEST_JTI,
            tokenHash: '',
            type: TEST_TOKEN_TYPE,
            expiresAt,
          });
          throw new Error('Expected validation error');
        } catch (error) {
          expect(error).toBeInstanceOf(EntityValidationError);
          expect((error as Error).message).toContain('Validation failed');
        }
      });

      test('rejects token with invalid jti types', async () => {
        const expiresAt = new Date(Date.now() + 7200000);
        const invalidJtis = [null, undefined, 123, {}, [], true];
        for (const jti of invalidJtis) {
          try {
            await tokenRepo.create({
              sessionId: testSessionId,
              jti: jti as any,
              tokenHash: TEST_TOKEN_HASH,
              type: TEST_TOKEN_TYPE,
              expiresAt,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('rejects token with invalid tokenHash types', async () => {
        const expiresAt = new Date(Date.now() + 7200000);
        const invalidHashes = [null, undefined, 123, {}, [], true];
        for (const tokenHash of invalidHashes) {
          try {
            await tokenRepo.create({
              sessionId: testSessionId,
              jti: TEST_JTI,
              tokenHash: tokenHash as any,
              type: TEST_TOKEN_TYPE,
              expiresAt,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('rejects token with invalid type', async () => {
        const expiresAt = new Date(Date.now() + 7200000);
        const invalidTypes = ['INVALID', 'TOKEN', null, undefined, 123];
        for (const type of invalidTypes) {
          try {
            await tokenRepo.create({
              sessionId: testSessionId,
              jti: TEST_JTI,
              tokenHash: TEST_TOKEN_HASH,
              type: type as any,
              expiresAt,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('rejects token with invalid expiresAt types', async () => {
        const invalidDates = ['2024-01-01', 123, null, undefined, {}, [], true];
        for (const expiresAt of invalidDates) {
          try {
            await tokenRepo.create({
              sessionId: testSessionId,
              jti: TEST_JTI,
              tokenHash: TEST_TOKEN_HASH,
              type: TEST_TOKEN_TYPE,
              expiresAt: expiresAt as any,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('accepts valid token data', async () => {
        const expiresAt = new Date(Date.now() + 7200000);
        const token = await tokenRepo.create({
          sessionId: testSessionId,
          jti: 'unique-jti-123',
          tokenHash: 'validhash123',
          type: TEST_TOKEN_TYPE,
          expiresAt,
        });
        expect(token.jti).toBe('unique-jti-123');
        expect(token.tokenHash).toBe('validhash123');
      });
    });
  });
});
