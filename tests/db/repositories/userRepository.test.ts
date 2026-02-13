import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {DataSource} from 'typeorm';
import {User, AccountStatus} from '../../../src/db/entities';
import {getUserRepository, type UserRepository} from '../../../src/db/repositories/userRepository';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';

const TEST_USER_NAME = 'TestUser';
const TEST_USER_EMAIL = 'test@test.com';
const TEST_USER_PASSWORD = 'password123456789badpassword';

describe('UserRepository', () => {
  let dataSource: DataSource;
  let userRepo: UserRepository;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    userRepo = getUserRepository(dataSource.getRepository(User));
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE user');
    await dataSource.query('TRUNCATE TABLE credentials');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('create', () => {
    test('creates user with credentials', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
        displayName: TEST_USER_NAME,
      });

      expect(user.id).toBeDefined();
      expect(user.displayName).toBe(TEST_USER_NAME);
      expect(user.accountStatus).toBe(AccountStatus.PENDING);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('creates user without displayName', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
      });

      expect(user.displayName).toBeNull();
      expect(user.accountStatus).toBe(AccountStatus.PENDING);
    });

    test('throws error on duplicate email', async () => {
      await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
      });

      await expect(
        userRepo.create({
          credentials: {
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD,
          },
        }),
      ).rejects.toThrow();
    });

    test('creates multiple users with different emails', async () => {
      const user1 = await userRepo.create({
        credentials: {
          email: 'user1@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      const user2 = await userRepo.create({
        credentials: {
          email: 'user2@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('findById', () => {
    test('finds user by id', async () => {
      const created = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
      });

      const found = await userRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    test('returns null for non-existent id', async () => {
      const found = await userRepo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for invalid uuid format', async () => {
      const found = await userRepo.findById('not-a-uuid');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    test('finds user by email', async () => {
      const created = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
      });

      const found = await userRepo.findByEmail(TEST_USER_EMAIL);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    test('returns null for non-existent email', async () => {
      const found = await userRepo.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });
    test('email search is case-insensitive', async () => {
      await userRepo.create({
        credentials: {
          email: 'test@example.com',
          password: TEST_USER_PASSWORD,
        },
      });

      const found = await userRepo.findByEmail('TEST@EXAMPLE.COM');
      expect(found).toBeDefined();
    });
  });

  describe('update', () => {
    test('updates user fields', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
        displayName: 'OriginalName',
      });

      const updated = await userRepo.update(user.id, {
        displayName: 'UpdatedName',
        accountStatus: AccountStatus.ACTIVE,
      });

      expect(updated.displayName).toBe('UpdatedName');
      expect(updated.accountStatus).toBe(AccountStatus.ACTIVE);
    });

    test('updates only displayName', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
        displayName: 'OriginalName',
      });

      const updated = await userRepo.update(user.id, {
        displayName: 'NewName',
      });

      expect(updated.displayName).toBe('NewName');
      expect(updated.accountStatus).toBe(AccountStatus.PENDING);
    });

    test('updates only accountStatus', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
        displayName: 'Test',
      });

      const updated = await userRepo.update(user.id, {
        accountStatus: AccountStatus.SUSPENDED,
      });

      expect(updated.accountStatus).toBe(AccountStatus.SUSPENDED);
      expect(updated.displayName).toBe('Test');
    });

    test('can set displayName to null', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
        displayName: 'Test',
      });

      const updated = await userRepo.update(user.id, {
        displayName: null,
      });

      expect(updated.displayName).toBeNull();
    });

    test('throws error for non-existent user', async () => {
      await expect(
        userRepo.update('550e8400-e29b-41d4-a716-446655440000', {
          displayName: 'Test',
        }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('findByIdWithSessions', () => {
    test('loads sessions relation', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
      });

      const found = await userRepo.findByIdWithSessions(user.id);
      expect(found?.sessions).toBeDefined();
      expect(Array.isArray(found?.sessions)).toBe(true);
      expect(found?.sessions.length).toBe(0);
    });

    test('returns null for non-existent id', async () => {
      const found = await userRepo.findByIdWithSessions('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });
  });

  describe('findByIdWithLists', () => {
    test('loads lists relation', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
      });

      const found = await userRepo.findByIdWithLists(user.id);
      expect(found?.lists).toBeDefined();
      expect(Array.isArray(found?.lists)).toBe(true);
      expect(found?.lists.length).toBe(0);
    });
  });

  describe('delete', () => {
    test('soft deletes user', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
      });

      await userRepo.delete(user.id);

      const found = await userRepo.findById(user.id);
      expect(found).toBeNull();
    });

    test('throws error when deleting non-existent user', async () => {
      await expect(userRepo.delete('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'User not found',
      );
    });

    test('returns deleted user', async () => {
      const user = await userRepo.create({
        credentials: {
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        },
      });

      const deleted = await userRepo.delete(user.id);
      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(user.id);
      expect(deleted.deletedAt).toBeDefined();
    });
  });

  describe('validation', () => {
    describe('create validation', () => {
      test('rejects user with invalid displayName types', async () => {
        const invalidNames = [123, {}, [], true];
        for (const displayName of invalidNames) {
          await expect(
            userRepo.create({
              credentials: {
                email: TEST_USER_EMAIL,
                password: TEST_USER_PASSWORD,
              },
              displayName: displayName as any,
            }),
          ).rejects.toThrow('Validation failed');
        }
      });

      test('rejects user with non-alphanumeric displayName', async () => {
        const invalidNames = ['user@123', 'name!test', 'with spaces', 'user#tag'];
        for (const displayName of invalidNames) {
          await expect(
            userRepo.create({
              credentials: {
                email: TEST_USER_EMAIL,
                password: TEST_USER_PASSWORD,
              },
              displayName,
            }),
          ).rejects.toThrow('Validation failed');
        }
      });

      test('accepts valid alphanumeric displayNames', async () => {
        const validNames = ['user123', 'TestUser', 'username456'];
        for (const displayName of validNames) {
          const user = await userRepo.create({
            credentials: {
              email: `${displayName}@test.com`,
              password: TEST_USER_PASSWORD,
            },
            displayName,
          });
          expect(user.displayName).toBe(displayName);
        }
      });

      test('accepts null displayName', async () => {
        const user = await userRepo.create({
          credentials: {
            email: 'nullname@test.com',
            password: TEST_USER_PASSWORD,
          },
        });
        expect(user.displayName).toBeNull();
      });
    });

    describe('update validation', () => {
      test('rejects update with invalid displayName types', async () => {
        const created = await userRepo.create({
          credentials: {
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD,
          },
        });

        const invalidNames = [123, {}, [], true];
        for (const displayName of invalidNames) {
          await expect(
            userRepo.update(created.id, {displayName: displayName as any}),
          ).rejects.toThrow('Validation failed');
        }
      });

      test('rejects update with non-alphanumeric displayName', async () => {
        const created = await userRepo.create({
          credentials: {
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD,
          },
        });

        const invalidNames = ['user@123', 'name!test', 'with spaces'];
        for (const displayName of invalidNames) {
          await expect(userRepo.update(created.id, {displayName})).rejects.toThrow(
            'Validation failed',
          );
        }
      });

      test('rejects update with invalid accountStatus', async () => {
        const created = await userRepo.create({
          credentials: {
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD,
          },
        });

        const invalidStatuses = ['INVALID', 'UNKNOWN', 123, null];
        for (const accountStatus of invalidStatuses) {
          await expect(
            userRepo.update(created.id, {accountStatus: accountStatus as any}),
          ).rejects.toThrow('Validation failed');
        }
      });
    });
  });
});
