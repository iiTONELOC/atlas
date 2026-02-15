import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {DataSource} from 'typeorm';
import {List, User} from '../../../src/entities';
import {getListRepository, ListRepository} from '../../../src/repositories/listRepository';
import {getUserRepository} from '../../../src/repositories/userRepository';
import {EntityValidationError} from '../../../src/repositories/errors';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';

const TEST_LIST_NAME = 'Test List';
const TEST_USER_EMAIL = 'test@test.com';
const TEST_USER_PASSWORD = 'password123456789badpassword';

describe('ListRepository', () => {
  let dataSource: DataSource;
  let listRepo: ListRepository;
  let userRepo: ReturnType<typeof getUserRepository>;
  let testUser: User;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    listRepo = getListRepository(dataSource.getRepository(List));
    userRepo = getUserRepository(dataSource.getRepository(User));
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE list');
    await dataSource.query('TRUNCATE TABLE user');
    await dataSource.query('TRUNCATE TABLE credentials');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create a test user for lists
    testUser = await userRepo.create({
      credentials: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      },
    });
  });

  describe('create', () => {
    test('creates list with name and userId', async () => {
      const list = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      expect(list.id).toBeDefined();
      expect(list.name).toBe(TEST_LIST_NAME);
      expect(list.isDefault).toBe(false);
      expect(list.createdAt).toBeDefined();
      expect(list.updatedAt).toBeDefined();
      expect(list.deletedAt).toBeNull();
    });

    test('creates list with isDefault true', async () => {
      const list = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
        isDefault: true,
      });

      expect(list.isDefault).toBe(true);
    });

    test('creates list with isDefault false', async () => {
      const list = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
        isDefault: false,
      });

      expect(list.isDefault).toBe(false);
    });

    test('creates multiple lists for same user', async () => {
      const list1 = await listRepo.create({
        name: 'List 1',
        userId: testUser.id,
      });

      const list2 = await listRepo.create({
        name: 'List 2',
        userId: testUser.id,
      });

      expect(list1.id).not.toBe(list2.id);
      expect(list1.name).not.toBe(list2.name);
    });

    test('creates lists for different users', async () => {
      const user2 = await userRepo.create({
        credentials: {
          email: 'user2@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      const list1 = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      const list2 = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: user2.id,
      });

      expect(list1.id).not.toBe(list2.id);
    });
  });

  describe('findById', () => {
    test('finds list by id', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      const found = await listRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe(TEST_LIST_NAME);
    });

    test('finds list with user relation', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      const found = await listRepo.findById(created.id);
      expect(found?.user).toBeDefined();
      expect(found?.user.id).toBe(testUser.id);
    });

    test('finds list with items relation', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      const found = await listRepo.findById(created.id);
      expect(found?.items).toBeDefined();
      expect(Array.isArray(found?.items)).toBe(true);
    });

    test('returns null for non-existent id', async () => {
      const found = await listRepo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for invalid uuid format', async () => {
      const found = await listRepo.findById('not-a-uuid');
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    test('finds lists by userId', async () => {
      await listRepo.create({
        name: 'List 1',
        userId: testUser.id,
      });

      await listRepo.create({
        name: 'List 2',
        userId: testUser.id,
      });

      const found = await listRepo.findByUserId(testUser.id);
      expect(found).toBeDefined();
      expect(Array.isArray(found)).toBe(true);
      expect(found.length).toBe(2);
    });

    test('returns empty array for user with no lists', async () => {
      const user2 = await userRepo.create({
        credentials: {
          email: 'user2@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      const found = await listRepo.findByUserId(user2.id);
      expect(Array.isArray(found)).toBe(true);
      expect(found.length).toBe(0);
    });

    test('returns only lists for specified user', async () => {
      const user2 = await userRepo.create({
        credentials: {
          email: 'user2@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      await listRepo.create({
        name: 'User 1 List',
        userId: testUser.id,
      });

      await listRepo.create({
        name: 'User 2 List',
        userId: user2.id,
      });

      const found = await listRepo.findByUserId(testUser.id);
      expect(found.length).toBe(1);
      expect(found[0].name).toBe('User 1 List');
    });

    test('returns lists with items relation', async () => {
      await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      const found = await listRepo.findByUserId(testUser.id);
      expect(found[0].items).toBeDefined();
      expect(Array.isArray(found[0].items)).toBe(true);
    });
  });

  describe('findDefaultByUserId', () => {
    test('finds default list for user', async () => {
      await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
        isDefault: true,
      });

      const found = await listRepo.findDefaultByUserId(testUser.id);
      expect(found).toBeDefined();
      expect(found?.isDefault).toBe(true);
      expect(found?.user.id).toBe(testUser.id);
    });

    test('returns null when user has no default list', async () => {
      await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
        isDefault: false,
      });

      const found = await listRepo.findDefaultByUserId(testUser.id);
      expect(found).toBeNull();
    });

    test('returns only default list when multiple lists exist', async () => {
      await listRepo.create({
        name: 'Regular List',
        userId: testUser.id,
        isDefault: false,
      });

      await listRepo.create({
        name: 'Default List',
        userId: testUser.id,
        isDefault: true,
      });

      const found = await listRepo.findDefaultByUserId(testUser.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Default List');
      expect(found?.isDefault).toBe(true);
    });

    test('returns list with items relation', async () => {
      await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
        isDefault: true,
      });

      const found = await listRepo.findDefaultByUserId(testUser.id);
      expect(found?.items).toBeDefined();
      expect(Array.isArray(found?.items)).toBe(true);
    });

    test('returns null for non-existent user', async () => {
      const found = await listRepo.findDefaultByUserId('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    test('updates list name', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      const newName = 'Updated List Name';
      const updated = await listRepo.update(created.id, {
        name: newName,
      });

      expect(updated.name).toBe(newName);
    });

    test('updates list isDefault', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
        isDefault: false,
      });

      const updated = await listRepo.update(created.id, {
        isDefault: true,
      });

      expect(updated.isDefault).toBe(true);
    });

    test('updates multiple fields', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
        isDefault: false,
      });

      const updated = await listRepo.update(created.id, {
        name: 'New Name',
        isDefault: true,
      });

      expect(updated.name).toBe('New Name');
      expect(updated.isDefault).toBe(true);
    });

    test('updates only name without changing isDefault', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
        isDefault: true,
      });

      const updated = await listRepo.update(created.id, {
        name: 'New Name',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.isDefault).toBe(true);
    });

    test('updates only isDefault without changing name', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
        isDefault: false,
      });

      const updated = await listRepo.update(created.id, {
        isDefault: true,
      });

      expect(updated.name).toBe(TEST_LIST_NAME);
      expect(updated.isDefault).toBe(true);
    });

    test('throws error when updating non-existent list', async () => {
      await expect(
        listRepo.update('550e8400-e29b-41d4-a716-446655440000', {
          name: 'New Name',
        }),
      ).rejects.toThrow('List not found');
    });
  });

  describe('delete', () => {
    test('deletes list', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      await listRepo.delete(created.id);

      const found = await listRepo.findById(created.id);
      expect(found).toBeNull();
    });

    test('throws error when deleting non-existent list', async () => {
      await expect(listRepo.delete('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'List not found',
      );
    });

    test('deleted list is not returned by findById', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      await listRepo.delete(created.id);

      const found = await listRepo.findById(created.id);
      expect(found).toBeNull();
    });

    test('deleted list is not returned by findByUserId', async () => {
      const created = await listRepo.create({
        name: TEST_LIST_NAME,
        userId: testUser.id,
      });

      await listRepo.delete(created.id);

      const found = await listRepo.findByUserId(testUser.id);
      expect(found.length).toBe(0);
    });
  });

  describe('validation', () => {
    describe('create validation', () => {
      test('rejects list with empty name', async () => {
        try {
          await listRepo.create({
            name: '',
            userId: testUser.id,
          });
          throw new Error('Expected validation error');
        } catch (error) {
          expect(error).toBeInstanceOf(EntityValidationError);
          expect((error as Error).message).toContain('Validation failed');
        }
      });

      test('rejects list with name too long', async () => {
        try {
          await listRepo.create({
            name: 'a'.repeat(256),
            userId: testUser.id,
          });
          throw new Error('Expected validation error');
        } catch (error) {
          expect(error).toBeInstanceOf(EntityValidationError);
          expect((error as Error).message).toContain('Validation failed');
        }
      });

      test('rejects list with invalid name types', async () => {
        const invalidNames = [123, {}, [], true];
        for (const name of invalidNames) {
          try {
            await listRepo.create({
              name: name as any,
              userId: testUser.id,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('rejects list with invalid isDefault types', async () => {
        const invalidDefaults = ['true', 'yes', 1, 0, {}, []];
        for (const isDefault of invalidDefaults) {
          try {
            await listRepo.create({
              name: TEST_LIST_NAME,
              userId: testUser.id,
              isDefault: isDefault as any,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('accepts valid list names', async () => {
        const validNames = ['a', 'My List', 'Shopping List 2024', 'a'.repeat(255)];
        for (const name of validNames) {
          const list = await listRepo.create({
            name,
            userId: testUser.id,
          });
          expect(list.name).toBe(name);
        }
      });
    });

    describe('update validation', () => {
      test('rejects update with empty name', async () => {
        const created = await listRepo.create({
          name: TEST_LIST_NAME,
          userId: testUser.id,
        });

        try {
          await listRepo.update(created.id, {name: ''});
          throw new Error('Expected validation error');
        } catch (error) {
          expect(error).toBeInstanceOf(EntityValidationError);
          expect((error as Error).message).toContain('Validation failed');
        }
      });

      test('rejects update with name too long', async () => {
        const created = await listRepo.create({
          name: TEST_LIST_NAME,
          userId: testUser.id,
        });

        try {
          await listRepo.update(created.id, {name: 'a'.repeat(256)});
          throw new Error('Expected validation error');
        } catch (error) {
          expect(error).toBeInstanceOf(EntityValidationError);
          expect((error as Error).message).toContain('Validation failed');
        }
      });

      test('rejects update with invalid isDefault types', async () => {
        const created = await listRepo.create({
          name: TEST_LIST_NAME,
          userId: testUser.id,
        });

        const invalidDefaults = ['true', 'yes', 1, 0, {}];
        for (const isDefault of invalidDefaults) {
          try {
            await listRepo.update(created.id, {isDefault: isDefault as any});
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });
    });
  });
});
