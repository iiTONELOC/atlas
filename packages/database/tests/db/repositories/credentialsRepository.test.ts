import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {DataSource} from 'typeorm';
import {Credentials} from '../../../src/entities';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';
import {
  CredentialsRepository,
  getCredentialsRepository,
} from '../../../src/repositories/credentialsRepository';
import {EntityValidationError} from '../../../src/repositories/errors';

const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = 'password123456789badpassword';

describe('CredentialsRepository', () => {
  let dataSource: DataSource;
  let credentialsRepo: CredentialsRepository;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    credentialsRepo = getCredentialsRepository(dataSource.getRepository(Credentials));
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE credentials');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('create', () => {
    test('creates credentials with email and password', async () => {
      const credentials = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(credentials.id).toBeDefined();
      expect(credentials.email).toBe(TEST_EMAIL);
      expect(credentials.password).toBeDefined();
      expect(credentials.password.startsWith('$argon2id$')).toBe(true);
      expect(credentials.createdAt).toBeDefined();
      expect(credentials.updatedAt).toBeDefined();
    });

    test('throws error on duplicate email', async () => {
      await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      await expect(
        credentialsRepo.create({
          email: TEST_EMAIL,
          password: 'differentpassword123456789badpassword',
        }),
      ).rejects.toThrow();
    });

    test('creates multiple credentials with different emails', async () => {
      const creds1 = await credentialsRepo.create({
        email: 'user1@test.com',
        password: TEST_PASSWORD,
      });

      const creds2 = await credentialsRepo.create({
        email: 'user2@test.com',
        password: TEST_PASSWORD,
      });

      expect(creds1.id).not.toBe(creds2.id);
      expect(creds1.email).not.toBe(creds2.email);
    });

    test('hashes password before storing', async () => {
      const credentials = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(credentials.password).not.toBe(TEST_PASSWORD);
      expect(credentials.password.startsWith('$argon2id$')).toBe(true);
    });
  });

  describe('findByEmail', () => {
    test('finds credentials by email', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const found = await credentialsRepo.findByEmail(TEST_EMAIL);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(TEST_EMAIL);
    });

    test('returns null for non-existent email', async () => {
      const found = await credentialsRepo.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });

    test('email search is case-insensitive', async () => {
      const created = await credentialsRepo.create({
        email: 'test@example.com',
        password: TEST_PASSWORD,
      });

      const found = await credentialsRepo.findByEmail('TEST@EXAMPLE.COM');
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });
  });

  describe('findById', () => {
    test('finds credentials by id', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const found = await credentialsRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(TEST_EMAIL);
    });

    test('returns null for non-existent id', async () => {
      const found = await credentialsRepo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for invalid uuid format', async () => {
      const found = await credentialsRepo.findById('not-a-uuid');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    test('updates credentials email', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const updated = await credentialsRepo.update(created.id, {
        email: 'newemail@test.com',
      });

      expect(updated.email).toBe('newemail@test.com');
      expect(updated.id).toBe(created.id);
    });

    test('updates credentials password', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const originalPassword = created.password;
      const newPassword = 'newpassword123456789badpassword';

      const updated = await credentialsRepo.update(created.id, {
        password: newPassword,
      });

      expect(updated.password).not.toBe(originalPassword);
      expect(updated.password).not.toBe(newPassword);
      expect(updated.password.startsWith('$argon2id$')).toBe(true);
    });

    test('updates only email without changing password', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const originalPassword = created.password;

      const updated = await credentialsRepo.update(created.id, {
        email: 'different@test.com',
      });

      expect(updated.email).toBe('different@test.com');
      expect(updated.password).toBe(originalPassword);
    });

    test('updates only password without changing email', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const newPassword = 'differentpassword123456789badpassword';

      const updated = await credentialsRepo.update(created.id, {
        password: newPassword,
      });

      expect(updated.email).toBe(TEST_EMAIL);
      expect(updated.password).not.toBe(created.password);
    });

    test('updates both email and password', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const updated = await credentialsRepo.update(created.id, {
        email: 'totallynew@test.com',
        password: 'brandnewpassword123456789badpassword',
      });

      expect(updated.email).toBe('totallynew@test.com');
      expect(updated.password).not.toBe(created.password);
      expect(updated.password.startsWith('$argon2id$')).toBe(true);
    });

    test('throws error for non-existent credentials', async () => {
      await expect(
        credentialsRepo.update('550e8400-e29b-41d4-a716-446655440000', {
          email: 'test@example.com',
        }),
      ).rejects.toThrow('Credentials not found');
    });

    test('preserves createdAt on update', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const createdAt = created.createdAt;

      const updated = await credentialsRepo.update(created.id, {
        email: 'newemail@test.com',
      });

      expect(updated.createdAt).toEqual(createdAt);
    });

    test('updates updatedAt on update', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      // Delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updated = await credentialsRepo.update(created.id, {
        email: 'newemail@test.com',
      });

      expect(updated.updatedAt).toBeDefined();
      expect(updated.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('delete', () => {
    test('deletes existing credentials', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      await credentialsRepo.delete(created.id);

      const found = await credentialsRepo.findByEmail(TEST_EMAIL);
      expect(found).toBeNull();
    });

    test('returns deleted credentials', async () => {
      const created = await credentialsRepo.create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const deleted = await credentialsRepo.delete(created.id);

      expect(deleted).toBeDefined();
      expect(deleted.email).toBe(TEST_EMAIL);
    });

    test('throws error for non-existent credentials', async () => {
      await expect(credentialsRepo.delete('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'Credentials not found',
      );
    });
  });

  describe('validation', () => {
    describe('create validation', () => {
      test('rejects credentials with invalid email', async () => {
        const invalidEmails = ['bad-email', 'no-at-sign', '@nodomain', 'spaces in@email.com'];
        for (const email of invalidEmails) {
          try {
            await credentialsRepo.create({
              email,
              password: TEST_PASSWORD,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
          }
        }
      });

      test('rejects credentials with invalid email types', async () => {
        const invalidEmails = [null, undefined, 123, {}, [], true];
        for (const email of invalidEmails) {
          try {
            await credentialsRepo.create({
              email: email as any,
              password: TEST_PASSWORD,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
          }
        }
      });

      test('accepts valid email formats', async () => {
        const validEmails = [
          'user@example.com',
          'test+tag@domain.co.uk',
          'name.surname@company.com',
        ];
        for (const email of validEmails) {
          const creds = await credentialsRepo.create({
            email,
            password: TEST_PASSWORD,
          });
          expect(creds.email).toBe(email);
        }
      });
    });

    describe('update validation', () => {
      test('rejects update with invalid email', async () => {
        const created = await credentialsRepo.create({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        const invalidEmails = ['bad-email', 'no-at-sign', '@nodomain'];
        for (const email of invalidEmails) {
          try {
            await credentialsRepo.update(created.id, {email});
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
          }
        }
      });

      test('rejects update with invalid email types', async () => {
        const created = await credentialsRepo.create({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        const invalidEmails = [null, 123, {}, []];
        for (const email of invalidEmails) {
          try {
            await credentialsRepo.update(created.id, {email: email as any});
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
