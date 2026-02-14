import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {DataSource} from 'typeorm';
import {UserProduct, User, Product} from '../../../src/db/entities';
import {
  getUserProductRepository,
  UserProductRepository,
} from '../../../src/db/repositories/userProductRepository';
import {getUserRepository} from '../../../src/db/repositories/userRepository';
import {ProductRepository} from '../../../src/db/repositories/productRepository';
import {EntityValidationError} from '../../../src/db/repositories/errors';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';

const TEST_USER_EMAIL = 'test@test.com';
const TEST_USER_PASSWORD = 'password123456789badpassword';
const TEST_PRODUCT_NAME = 'Test Product';
const TEST_BARCODE = '1234567890123';

describe('UserProductRepository', () => {
  let dataSource: DataSource;
  let userProductRepo: UserProductRepository;
  let userRepo: ReturnType<typeof getUserRepository>;
  let productRepo: ProductRepository;
  let testUser: User;
  let testProduct: Product;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    userProductRepo = getUserProductRepository(dataSource.getRepository(UserProduct));
    userRepo = getUserRepository(dataSource.getRepository(User));
    productRepo = new ProductRepository(dataSource.getRepository(Product));
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE user_product');
    await dataSource.query('TRUNCATE TABLE product');
    await dataSource.query('TRUNCATE TABLE user');
    await dataSource.query('TRUNCATE TABLE credentials');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create test user
    testUser = await userRepo.create({
      credentials: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      },
    });

    // Create test product
    testProduct = await productRepo.create({
      name: TEST_PRODUCT_NAME,
      barcode: TEST_BARCODE,
    });
  });

  describe('create', () => {
    test('creates user product with userId and productId', async () => {
      const userProduct = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      expect(userProduct.id).toBeDefined();
      expect(userProduct.productAlias).toBeNull();
      expect(userProduct.createdAt).toBeDefined();
      expect(userProduct.updatedAt).toBeDefined();
      expect(userProduct.deletedAt).toBeNull();
    });

    test('creates user product with productAlias', async () => {
      const alias = 'My Favorite Product';
      const userProduct = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
        productAlias: alias,
      });

      expect(userProduct.productAlias).toBe(alias);
    });

    test('creates user product without productAlias', async () => {
      const userProduct = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      expect(userProduct.productAlias).toBeNull();
    });

    test('creates multiple user products for same user', async () => {
      const product2 = await productRepo.create({
        name: 'Product 2',
        barcode: '9876543210987',
      });

      const userProduct1 = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const userProduct2 = await userProductRepo.create({
        userId: testUser.id,
        productId: product2.id,
      });

      expect(userProduct1.id).not.toBe(userProduct2.id);
    });

    test('creates same product for different users', async () => {
      const user2 = await userRepo.create({
        credentials: {
          email: 'user2@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      const userProduct1 = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const userProduct2 = await userProductRepo.create({
        userId: user2.id,
        productId: testProduct.id,
      });

      expect(userProduct1.id).not.toBe(userProduct2.id);
    });

    test('creates user products with different aliases', async () => {
      const product2 = await productRepo.create({
        name: 'Product 2',
        barcode: '9876543210987',
      });

      const userProduct1 = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
        productAlias: 'Alias 1',
      });

      const userProduct2 = await userProductRepo.create({
        userId: testUser.id,
        productId: product2.id,
        productAlias: 'Alias 2',
      });

      expect(userProduct1.productAlias).toBe('Alias 1');
      expect(userProduct2.productAlias).toBe('Alias 2');
    });
  });

  describe('findByUserId', () => {
    test('finds user products by userId', async () => {
      await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const found = await userProductRepo.findByUserId(testUser.id);
      expect(found).toBeDefined();
      expect(Array.isArray(found)).toBe(true);
      expect(found.length).toBe(1);
    });

    test('finds multiple user products for same user', async () => {
      const product2 = await productRepo.create({
        name: 'Product 2',
        barcode: '9876543210987',
      });

      await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      await userProductRepo.create({
        userId: testUser.id,
        productId: product2.id,
      });

      const found = await userProductRepo.findByUserId(testUser.id);
      expect(found.length).toBe(2);
    });

    test('returns empty array for user with no products', async () => {
      const user2 = await userRepo.create({
        credentials: {
          email: 'user2@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      const found = await userProductRepo.findByUserId(user2.id);
      expect(Array.isArray(found)).toBe(true);
      expect(found.length).toBe(0);
    });

    test('returns only products for specified user', async () => {
      const user2 = await userRepo.create({
        credentials: {
          email: 'user2@test.com',
          password: TEST_USER_PASSWORD,
        },
      });

      await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const product2 = await productRepo.create({
        name: 'Product 2',
        barcode: '9876543210987',
      });

      await userProductRepo.create({
        userId: user2.id,
        productId: product2.id,
      });

      const found = await userProductRepo.findByUserId(testUser.id);
      expect(found.length).toBe(1);
    });

    test('returns user products with productData relation', async () => {
      await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const found = await userProductRepo.findByUserId(testUser.id);
      expect(found[0].productData).toBeDefined();
    });

    test('returns null for non-existent user', async () => {
      const found = await userProductRepo.findByUserId('550e8400-e29b-41d4-a716-446655440000');
      expect(Array.isArray(found)).toBe(true);
      expect(found.length).toBe(0);
    });
  });

  describe('findById', () => {
    test('finds user product by id', async () => {
      const created = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const found = await userProductRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    test('finds user product with user relation', async () => {
      const created = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const found = await userProductRepo.findById(created.id);
      expect(found?.user).toBeDefined();
      expect(found?.user.id).toBe(testUser.id);
    });

    test('finds user product with productData relation', async () => {
      const created = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const found = await userProductRepo.findById(created.id);
      expect(found?.productData).toBeDefined();
      expect(found?.productData.id).toBe(testProduct.id);
    });

    test('returns null for non-existent id', async () => {
      const found = await userProductRepo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for invalid uuid format', async () => {
      const found = await userProductRepo.findById('not-a-uuid');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    test('updates user product productAlias', async () => {
      const created = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
        productAlias: 'Old Alias',
      });

      const updated = await userProductRepo.update(created.id, {
        productAlias: 'New Alias',
      });

      expect(updated.productAlias).toBe('New Alias');
    });

    test('updates productAlias to null', async () => {
      const created = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
        productAlias: 'Old Alias',
      });

      const updated = await userProductRepo.update(created.id, {
        productAlias: null,
      });

      expect(updated.productAlias).toBeNull();
    });

    test('updates productAlias from null to value', async () => {
      const created = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const updated = await userProductRepo.update(created.id, {
        productAlias: 'New Alias',
      });

      expect(updated.productAlias).toBe('New Alias');
    });

    test('throws error when updating non-existent user product', async () => {
      await expect(
        userProductRepo.update('550e8400-e29b-41d4-a716-446655440000', {
          productAlias: 'Test',
        }),
      ).rejects.toThrow('UserProduct not found');
    });

    test('returns updated user product with relations', async () => {
      const created = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      const updated = await userProductRepo.update(created.id, {
        productAlias: 'New Alias',
      });

      expect(updated.user).toBeDefined();
      expect(updated.productData).toBeDefined();
    });
  });

  describe('delete', () => {
    test('deletes user product', async () => {
      const created = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      await userProductRepo.delete(created.id);

      const found = await userProductRepo.findByUserId(testUser.id);
      expect(found.length).toBe(0);
    });

    test('throws error when deleting non-existent user product', async () => {
      await expect(userProductRepo.delete('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'UserProduct not found',
      );
    });

    test('deleted user product is not returned by findByUserId', async () => {
      const created = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      await userProductRepo.delete(created.id);

      const found = await userProductRepo.findByUserId(testUser.id);
      expect(found.length).toBe(0);
    });

    test('deleting one user product does not affect others', async () => {
      const product2 = await productRepo.create({
        name: 'Product 2',
        barcode: '9876543210987',
      });

      const userProduct1 = await userProductRepo.create({
        userId: testUser.id,
        productId: testProduct.id,
      });

      await userProductRepo.create({
        userId: testUser.id,
        productId: product2.id,
      });

      await userProductRepo.delete(userProduct1.id);

      const found = await userProductRepo.findByUserId(testUser.id);
      expect(found.length).toBe(1);
      expect(found[0].productData.id).toBe(product2.id);
    });
  });

  describe('validation', () => {
    describe('create validation', () => {
      test('rejects user product with invalid productAlias types', async () => {
        const invalidAliases = [123, {}, [], true];
        for (const productAlias of invalidAliases) {
          try {
            await userProductRepo.create({
              userId: testUser.id,
              productId: testProduct.id,
              productAlias: productAlias as any,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('accepts valid productAlias values', async () => {
        const validAliases = ['My Product', 'Favorite Item', 'Product 123'];
        for (const alias of validAliases) {
          const userProduct = await userProductRepo.create({
            userId: testUser.id,
            productId: testProduct.id,
            productAlias: alias,
          });
          expect(userProduct.productAlias).toBe(alias);
          await userProductRepo.delete(userProduct.id);
        }
      });

      test('accepts null productAlias', async () => {
        const userProduct = await userProductRepo.create({
          userId: testUser.id,
          productId: testProduct.id,
        });
        expect(userProduct.productAlias).toBeNull();
      });
    });

    describe('update validation', () => {
      test('rejects update with invalid productAlias types', async () => {
        const created = await userProductRepo.create({
          userId: testUser.id,
          productId: testProduct.id,
        });

        const invalidAliases = [123, {}, [], true];
        for (const productAlias of invalidAliases) {
          try {
            await userProductRepo.update(created.id, {productAlias: productAlias as any});
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('accepts valid productAlias updates', async () => {
        const created = await userProductRepo.create({
          userId: testUser.id,
          productId: testProduct.id,
        });

        const validAliases = ['Updated Product', 'New Alias', 'Product 456'];
        for (const alias of validAliases) {
          const updated = await userProductRepo.update(created.id, {productAlias: alias});
          expect(updated.productAlias).toBe(alias);
        }
      });

      test('accepts null productAlias update', async () => {
        const created = await userProductRepo.create({
          userId: testUser.id,
          productId: testProduct.id,
          productAlias: 'Old Alias',
        });

        const updated = await userProductRepo.update(created.id, {productAlias: null});
        expect(updated.productAlias).toBeNull();
      });
    });
  });
});
