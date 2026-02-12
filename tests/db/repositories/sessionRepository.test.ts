// tests/db/repositories/sessionRepository.test.ts
import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {DataSource} from 'typeorm';
import {User, Session} from '../../../src/db/entities';
import {
  SessionRepository,
  getSessionRepository,
} from '../../../src/db/repositories/sessionRepository';
import {getUserRepository} from '../../../src/db/repositories/userRepository';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';

const TEST_USER_EMAIL = 'test@test.com';
const TEST_USER_PASSWORD = 'password123456789badpassword';
const TEST_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const TEST_IP_ADDRESS = '192.168.1.1';

describe('SessionRepository', () => {
  let dataSource: DataSource;
  let sessionRepo: SessionRepository;
  let userRepo: any;
  let testUserId: string;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
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

    // Create a test user for session tests
    const user = await userRepo.create({
      credentials: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      },
    });
    testUserId = user.id;
  });

  describe('create', () => {
    test('creates session with user id and metadata', async () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      const session = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      expect(session.id).toBeDefined();
      expect(session.user.id).toBe(testUserId);
      expect(session.expiresAt).toEqual(expiresAt);
      expect(session.userAgent).toBe(TEST_USER_AGENT);
      expect(session.ipAddress).toBe(TEST_IP_ADDRESS);
      expect(session.isRevoked).toBe(false);
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });

    test('creates multiple sessions for same user', async () => {
      const expiresAt1 = new Date(Date.now() + 3600000);
      const expiresAt2 = new Date(Date.now() + 7200000);

      const session1 = await sessionRepo.create({
        userId: testUserId,
        expiresAt: expiresAt1,
        userAgent: 'Agent1',
        ipAddress: '192.168.1.1',
      });

      const session2 = await sessionRepo.create({
        userId: testUserId,
        expiresAt: expiresAt2,
        userAgent: 'Agent2',
        ipAddress: '192.168.1.2',
      });

      expect(session1.id).not.toBe(session2.id);
      expect(session1.userAgent).not.toBe(session2.userAgent);
    });

    test('new session is not revoked', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const session = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      expect(session.isRevoked).toBe(false);
    });
  });

  describe('findById', () => {
    test('finds session by id with relations', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      const found = await sessionRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.user).toBeDefined();
      expect(found?.user.id).toBe(testUserId);
    });

    test('returns null for non-existent id', async () => {
      const found = await sessionRepo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for invalid uuid format', async () => {
      const found = await sessionRepo.findById('not-a-uuid');
      expect(found).toBeNull();
    });

    test('loads token relation when present', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      const found = await sessionRepo.findById(created.id);
      expect(found?.token).toBeDefined();
    });
  });

  describe('update', () => {
    test('updates session expiresAt', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      const newExpiresAt = new Date(Date.now() + 7200000);
      const updated = await sessionRepo.update(created.id, {
        expiresAt: newExpiresAt,
      });

      expect(updated.expiresAt).toEqual(newExpiresAt);
      expect(updated.userAgent).toBe(TEST_USER_AGENT);
    });

    test('updates session userAgent', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      const newUserAgent = 'NewAgent/1.0';
      const updated = await sessionRepo.update(created.id, {
        userAgent: newUserAgent,
      });

      expect(updated.userAgent).toBe(newUserAgent);
      expect(updated.ipAddress).toBe(TEST_IP_ADDRESS);
    });

    test('updates session ipAddress', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      const newIpAddress = '192.168.1.100';
      const updated = await sessionRepo.update(created.id, {
        ipAddress: newIpAddress,
      });

      expect(updated.ipAddress).toBe(newIpAddress);
      expect(updated.userAgent).toBe(TEST_USER_AGENT);
    });

    test('updates multiple fields', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      const newExpiresAt = new Date(Date.now() + 7200000);
      const newUserAgent = 'UpdatedAgent/2.0';
      const newIpAddress = '10.0.0.1';

      const updated = await sessionRepo.update(created.id, {
        expiresAt: newExpiresAt,
        userAgent: newUserAgent,
        ipAddress: newIpAddress,
      });

      expect(updated.expiresAt).toEqual(newExpiresAt);
      expect(updated.userAgent).toBe(newUserAgent);
      expect(updated.ipAddress).toBe(newIpAddress);
    });

    test('throws error when trying to change userId', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      await expect(
        sessionRepo.update(created.id, {
          userAgent: 'NewAgent' as any,
          ...({userId: 'different-id'} as any),
        }),
      ).rejects.toThrow('Cannot change user of a session');
    });

    test('throws error for non-existent session', async () => {
      await expect(
        sessionRepo.update('550e8400-e29b-41d4-a716-446655440000', {
          userAgent: 'NewAgent',
        }),
      ).rejects.toThrow('Session not found');
    });

    test('preserves createdAt on update', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      const createdAt = created.createdAt;

      const updated = await sessionRepo.update(created.id, {
        userAgent: 'NewAgent',
      });

      expect(updated.createdAt).toEqual(createdAt);
    });
  });

  describe('revoke', () => {
    test('revokes active session', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      expect(created.isRevoked).toBe(false);

      const revoked = await sessionRepo.revoke(created.id);

      expect(revoked.isRevoked).toBe(true);
    });

    test('revoke is idempotent', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      await sessionRepo.revoke(created.id);
      const revoked2 = await sessionRepo.revoke(created.id);

      expect(revoked2.isRevoked).toBe(true);
    });

    test('throws error for non-existent session', async () => {
      await expect(sessionRepo.revoke('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'Session not found',
      );
    });
  });

  describe('delete', () => {
    test('deletes existing session', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const created = await sessionRepo.create({
        userId: testUserId,
        expiresAt,
        userAgent: TEST_USER_AGENT,
        ipAddress: TEST_IP_ADDRESS,
      });

      await sessionRepo.delete(created.id);

      const found = await sessionRepo.findById(created.id);
      expect(found).toBeNull();
    });

    test('throws error for non-existent session', async () => {
      await expect(sessionRepo.delete('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'Session not found',
      );
    });
  });
});
