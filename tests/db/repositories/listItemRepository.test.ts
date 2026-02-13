import {DataSource} from 'typeorm';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';
import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {ListItem, List, User, Product, UserProduct} from '../../../src/db/entities';
import {ListItemRepository} from '../../../src/db/repositories/listItemRepository';
import {getListRepository} from '../../../src/db/repositories/listRepository';
import {getUserRepository} from '../../../src/db/repositories/userRepository';
import {ProductRepository} from '../../../src/db/repositories/productRepository';
import {getUserProductRepository} from '../../../src/db/repositories/userProductRepository';

const TEST_USER_EMAIL = 'test@test.com';
const TEST_USER_PASSWORD = 'password123456789badpassword';
const TEST_LIST_NAME = 'Test List';
const TEST_PRODUCT_NAME = 'Test Product';
const TEST_BARCODE = '1234567890123';

describe('ListItemRepository', () => {
  let testUser: User;
  let testList: List;
  let testProduct: Product;
  let testUserProduct: UserProduct;
  let dataSource: DataSource;
  let listItemRepo: ListItemRepository;
  let listRepo: ReturnType<typeof getListRepository>;
  let userRepo: ReturnType<typeof getUserRepository>;
  let productRepo: ProductRepository;
  let userProductRepo: ReturnType<typeof getUserProductRepository>;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    listItemRepo = new ListItemRepository(dataSource.getRepository(ListItem));
    listRepo = getListRepository(dataSource.getRepository(List));
    userRepo = getUserRepository(dataSource.getRepository(User));
    productRepo = new ProductRepository(dataSource.getRepository(Product));
    userProductRepo = getUserProductRepository(dataSource.getRepository(UserProduct));
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE list_item');
    await dataSource.query('TRUNCATE TABLE list');
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

    // Create test list
    testList = await listRepo.create({
      name: TEST_LIST_NAME,
      userId: testUser.id,
    });

    // Create test product
    testProduct = await productRepo.create({
      name: TEST_PRODUCT_NAME,
      barcode: TEST_BARCODE,
    });

    // Create test user product
    testUserProduct = await userProductRepo.create({
      userId: testUser.id,
      productId: testProduct.id,
    });
  });

  describe('create', () => {
    test('creates list item with required fields', async () => {
      const listItem = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      expect(listItem.id).toBeDefined();
      expect(listItem.quantity).toBe(1);
      expect(listItem.isComplete).toBe(false);
      expect(listItem.notes).toBeNull();
      expect(listItem.createdAt).toBeDefined();
      expect(listItem.updatedAt).toBeDefined();
      expect(listItem.deletedAt).toBeNull();
    });

    test('creates list item with custom quantity', async () => {
      const listItem = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
        quantity: 5,
      });

      expect(listItem.quantity).toBe(5);
    });

    test('creates list item with notes', async () => {
      const notes = 'Get the organic version';
      const listItem = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
        notes,
      });

      expect(listItem.notes).toBe(notes);
    });

    test('creates list item with isComplete true', async () => {
      const listItem = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
        isComplete: true,
      });

      expect(listItem.isComplete).toBe(true);
    });

    test('creates list item with all optional fields', async () => {
      const listItem = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
        quantity: 3,
        notes: 'Test notes',
        isComplete: true,
      });

      expect(listItem.quantity).toBe(3);
      expect(listItem.notes).toBe('Test notes');
      expect(listItem.isComplete).toBe(true);
    });

    test('creates multiple list items for same list', async () => {
      const product2 = await productRepo.create({
        name: 'Product 2',
        barcode: '9876543210987',
      });

      const userProduct2 = await userProductRepo.create({
        userId: testUser.id,
        productId: product2.id,
      });

      const listItem1 = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      const listItem2 = await listItemRepo.create({
        userProductId: userProduct2.id,
        listId: testList.id,
      });

      expect(listItem1.id).not.toBe(listItem2.id);
    });
  });

  describe('findById', () => {
    test('finds list item by id', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      const found = await listItemRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    test('finds list item with product relation', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      const found = await listItemRepo.findById(created.id);
      expect(found?.product).toBeDefined();
      expect(found?.product.id).toBe(testUserProduct.id);
    });

    test('finds list item with list relation', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      const found = await listItemRepo.findById(created.id);
      expect(found?.list).toBeDefined();
      expect(found?.list.id).toBe(testList.id);
    });

    test('returns null for non-existent id', async () => {
      const found = await listItemRepo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for invalid uuid format', async () => {
      const found = await listItemRepo.findById('not-a-uuid');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    test('updates list item quantity', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
        quantity: 1,
      });

      const updated = await listItemRepo.update(created.id, {
        quantity: 5,
      });

      expect(updated.quantity).toBe(5);
    });

    test('updates list item notes', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      const newNotes = 'Updated notes';
      const updated = await listItemRepo.update(created.id, {
        notes: newNotes,
      });

      expect(updated.notes).toBe(newNotes);
    });

    test('updates list item isComplete', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
        isComplete: false,
      });

      const updated = await listItemRepo.update(created.id, {
        isComplete: true,
      });

      expect(updated.isComplete).toBe(true);
    });

    test('updates list item listId', async () => {
      const list2 = await listRepo.create({
        name: 'Second List',
        userId: testUser.id,
      });

      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      const updated = await listItemRepo.update(created.id, {
        listId: list2.id,
      });

      const found = await listItemRepo.findById(updated.id);
      expect(found?.list.id).toBe(list2.id);
    });

    test('updates multiple fields', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      const updated = await listItemRepo.update(created.id, {
        quantity: 3,
        notes: 'New notes',
        isComplete: true,
      });

      expect(updated.quantity).toBe(3);
      expect(updated.notes).toBe('New notes');
      expect(updated.isComplete).toBe(true);
    });

    test('throws error when updating non-existent list item', async () => {
      await expect(
        listItemRepo.update('550e8400-e29b-41d4-a716-446655440000', {
          quantity: 5,
        }),
      ).rejects.toThrow('ListItem not found');
    });

    test('updates only specified fields', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
        quantity: 2,
        notes: 'Original notes',
        isComplete: false,
      });

      const updated = await listItemRepo.update(created.id, {
        quantity: 5,
      });

      expect(updated.quantity).toBe(5);
      expect(updated.notes).toBe('Original notes');
      expect(updated.isComplete).toBe(false);
    });
  });

  describe('delete', () => {
    test('deletes list item', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      await listItemRepo.delete(created.id);

      const found = await listItemRepo.findById(created.id);
      expect(found).toBeNull();
    });

    test('throws error when deleting non-existent list item', async () => {
      await expect(listItemRepo.delete('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'ListItem not found',
      );
    });

    test('deleted list item is not returned by findById', async () => {
      const created = await listItemRepo.create({
        userProductId: testUserProduct.id,
        listId: testList.id,
      });

      await listItemRepo.delete(created.id);

      const found = await listItemRepo.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('validation', () => {
    describe('create validation', () => {
      test('rejects list item with invalid quantity types', async () => {
        const invalidQuantities = ['5', true, {}, [], null];
        for (const quantity of invalidQuantities) {
          await expect(
            listItemRepo.create({
              userProductId: testUserProduct.id,
              listId: testList.id,
              quantity: quantity as any,
            }),
          ).rejects.toThrow('Validation failed');
        }
      });

      test('rejects list item with invalid isComplete types', async () => {
        const invalidCompletes = ['true', 'yes', 1, 0, {}, []];
        for (const isComplete of invalidCompletes) {
          await expect(
            listItemRepo.create({
              userProductId: testUserProduct.id,
              listId: testList.id,
              isComplete: isComplete as any,
            }),
          ).rejects.toThrow('Validation failed');
        }
      });

      test('rejects list item with invalid notes types', async () => {
        const invalidNotes = [123, {}, [], true];
        for (const notes of invalidNotes) {
          await expect(
            listItemRepo.create({
              userProductId: testUserProduct.id,
              listId: testList.id,
              notes: notes as any,
            }),
          ).rejects.toThrow('Validation failed');
        }
      });

      test('accepts valid quantity values', async () => {
        const validQuantities = [1, 5, 10, 100, 999];
        for (const quantity of validQuantities) {
          const item = await listItemRepo.create({
            userProductId: testUserProduct.id,
            listId: testList.id,
            quantity,
          });
          expect(item.quantity).toBe(quantity);
          await listItemRepo.delete(item.id);
        }
      });
    });

    describe('update validation', () => {
      test('rejects update with invalid quantity types', async () => {
        const created = await listItemRepo.create({
          userProductId: testUserProduct.id,
          listId: testList.id,
        });

        const invalidQuantities = ['5', true, {}, []];
        for (const quantity of invalidQuantities) {
          await expect(
            listItemRepo.update(created.id, {quantity: quantity as any}),
          ).rejects.toThrow('Validation failed');
        }
      });

      test('rejects update with invalid isComplete types', async () => {
        const created = await listItemRepo.create({
          userProductId: testUserProduct.id,
          listId: testList.id,
        });

        const invalidCompletes = ['true', 1, 0, {}];
        for (const isComplete of invalidCompletes) {
          await expect(
            listItemRepo.update(created.id, {isComplete: isComplete as any}),
          ).rejects.toThrow('Validation failed');
        }
      });
    });
  });
});
