// tests/db/repositories/productRepository.test.ts
import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {DataSource} from 'typeorm';
import {Product, Source, SourceName} from '../../../src/db/entities';
import {ProductRepository} from '../../../src/db/repositories/productRepository';
import {getSourceRepository} from '../../../src/db/repositories/sourceRepository';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';

const TEST_PRODUCT_NAME = 'Test Product';
const TEST_BARCODE = '1234567890123';
const TEST_SOURCE_URL = 'https://example.com/barcode';

describe('ProductRepository', () => {
  let dataSource: DataSource;
  let productRepo: ProductRepository;
  let sourceRepo: ReturnType<typeof getSourceRepository>;
  let testSource: Source;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    productRepo = new ProductRepository(dataSource.getRepository(Product));
    sourceRepo = getSourceRepository(dataSource.getRepository(Source));
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE product');
    await dataSource.query('TRUNCATE TABLE source');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create a test source for products that need one
    testSource = await sourceRepo.create({
      name: SourceName.BARCODE_INDEX,
      url: TEST_SOURCE_URL,
    });
  });

  describe('create', () => {
    test('creates product with name, barcode and source', async () => {
      const product = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      expect(product.id).toBeDefined();
      expect(product.name).toBe(TEST_PRODUCT_NAME);
      expect(product.barcode).toBe(TEST_BARCODE);
      expect(product.source).toBeDefined();
      expect(product.createdAt).toBeDefined();
      expect(product.updatedAt).toBeDefined();
      expect(product.deletedAt).toBeNull();
    });

    test('throws error on duplicate barcode', async () => {
      await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      await expect(
        productRepo.create({
          name: 'Different Product',
          barcode: TEST_BARCODE,
          sourceId: testSource.id,
        }),
      ).rejects.toThrow();
    });

    test('creates multiple products with different barcodes', async () => {
      const product1 = await productRepo.create({
        name: 'Product 1',
        barcode: '1234567890123',
        sourceId: testSource.id,
      });

      const product2 = await productRepo.create({
        name: 'Product 2',
        barcode: '9876543210987',
        sourceId: testSource.id,
      });

      expect(product1.id).not.toBe(product2.id);
      expect(product1.barcode).not.toBe(product2.barcode);
    });
  });

  describe('findById', () => {
    test('finds product by id', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const found = await productRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe(TEST_PRODUCT_NAME);
      expect(found?.barcode).toBe(TEST_BARCODE);
    });

    test('finds product with source relation', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const found = await productRepo.findById(created.id);
      expect(found?.source).toBeDefined();
      expect(found?.source?.id).toBe(testSource.id);
    });

    test('returns null for non-existent id', async () => {
      const found = await productRepo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for invalid uuid format', async () => {
      const found = await productRepo.findById('not-a-uuid');
      expect(found).toBeNull();
    });
  });

  describe('findByBarcode', () => {
    test('finds product by barcode', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const found = await productRepo.findByBarcode(TEST_BARCODE);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.barcode).toBe(TEST_BARCODE);
    });

    test('finds product with source relation by barcode', async () => {
      await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const found = await productRepo.findByBarcode(TEST_BARCODE);
      expect(found?.source).toBeDefined();
      expect(found?.source?.id).toBe(testSource.id);
    });

    test('returns null for non-existent barcode', async () => {
      const found = await productRepo.findByBarcode('9999999999999');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    test('updates product name', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const newName = 'Updated Product Name';
      const updated = await productRepo.update(created.id, {
        name: newName,
      });

      expect(updated.name).toBe(newName);
      expect(updated.barcode).toBe(TEST_BARCODE);
    });

    test('updates product barcode', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const newBarcode = '9876543210987';
      const updated = await productRepo.update(created.id, {
        barcode: newBarcode,
      });

      expect(updated.barcode).toBe(newBarcode);
      expect(updated.name).toBe(TEST_PRODUCT_NAME);
    });

    test('updates product source', async () => {
      const source2 = await sourceRepo.create({
        name: SourceName.UPC_ITEM_DB,
        url: 'https://example2.com',
      });

      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const updated = await productRepo.update(created.id, {
        sourceId: source2.id,
      });

      const found = await productRepo.findById(updated.id);
      expect(found?.source?.id).toBe(source2.id);
    });

    test('updates multiple fields', async () => {
      const source2 = await sourceRepo.create({
        name: SourceName.UPC_ITEM_DB,
        url: 'https://example2.com',
      });

      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const updated = await productRepo.update(created.id, {
        name: 'New Name',
        barcode: '9876543210987',
        sourceId: source2.id,
      });

      expect(updated.name).toBe('New Name');
      expect(updated.barcode).toBe('9876543210987');
      const found = await productRepo.findById(updated.id);
      expect(found?.source?.id).toBe(source2.id);
    });

    test('throws error when updating non-existent product', async () => {
      await expect(
        productRepo.update('550e8400-e29b-41d4-a716-446655440000', {
          name: 'New Name',
        }),
      ).rejects.toThrow('Product not found');
    });

    test('preserves createdAt on update', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const originalCreatedAt = created.createdAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      const updated = await productRepo.update(created.id, {
        name: 'Updated Name',
      });

      expect(updated.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    test('updates updatedAt on update', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const originalUpdatedAt = created.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      const updated = await productRepo.update(created.id, {
        name: 'Updated Name',
      });

      expect(updated.updatedAt).toBeDefined();
      expect(updated.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('delete', () => {
    test('soft deletes product', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      await productRepo.delete(created.id);

      const found = await productRepo.findById(created.id);
      expect(found).toBeNull();
    });

    test('throws error when deleting non-existent product', async () => {
      await expect(productRepo.delete('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'Product not found',
      );
    });

    test('soft deleted product is not returned by findById', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      await productRepo.delete(created.id);

      const found = await productRepo.findById(created.id);
      expect(found).toBeNull();
    });

    test('soft deleted product is not returned by findByBarcode', async () => {
      const created = await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      await productRepo.delete(created.id);

      const found = await productRepo.findByBarcode(TEST_BARCODE);
      expect(found).toBeNull();
    });
  });
});
