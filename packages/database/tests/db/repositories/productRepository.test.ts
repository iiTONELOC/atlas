import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {DataSource} from 'typeorm';
import {Product, Source, SourceName} from '../../../src/db/entities';
import {ProductRepository} from '../../../src/db/repositories/productRepository';
import {getSourceRepository} from '../../../src/db/repositories/sourceRepository';
import {EntityValidationError} from '../../../src/db/repositories/errors';
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

  describe('findBySourceId', () => {
    test('finds products by source id', async () => {
      await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const found = await productRepo.findBySourceId(testSource.id);
      expect(found).toBeDefined();
      expect(Array.isArray(found)).toBe(true);
      expect(found.length).toBe(1);
    });

    test('finds multiple products from same source', async () => {
      await productRepo.create({
        name: 'Product 1',
        barcode: '1234567890123',
        sourceId: testSource.id,
      });

      await productRepo.create({
        name: 'Product 2',
        barcode: '9876543210987',
        sourceId: testSource.id,
      });

      const found = await productRepo.findBySourceId(testSource.id);
      expect(found.length).toBe(2);
    });

    test('returns empty array for source with no products', async () => {
      const source2 = await sourceRepo.create({
        name: SourceName.UPC_ITEM_DB,
        url: 'https://example.com/upc',
      });

      const found = await productRepo.findBySourceId(source2.id);
      expect(Array.isArray(found)).toBe(true);
      expect(found.length).toBe(0);
    });

    test('returns products with source relation', async () => {
      await productRepo.create({
        name: TEST_PRODUCT_NAME,
        barcode: TEST_BARCODE,
        sourceId: testSource.id,
      });

      const found = await productRepo.findBySourceId(testSource.id);
      expect(found[0].source).toBeDefined();
      expect(found[0].source?.id).toBe(testSource.id);
    });

    test('returns only products for specified source', async () => {
      const source2 = await sourceRepo.create({
        name: SourceName.UPC_ITEM_DB,
        url: 'https://example.com/upc',
      });

      await productRepo.create({
        name: 'Product 1',
        barcode: '1234567890123',
        sourceId: testSource.id,
      });

      await productRepo.create({
        name: 'Product 2',
        barcode: '9876543210987',
        sourceId: source2.id,
      });

      const found = await productRepo.findBySourceId(testSource.id);
      expect(found.length).toBe(1);
      expect(found[0].source?.id).toBe(testSource.id);
    });

    test('returns empty array for non-existent source', async () => {
      const found = await productRepo.findBySourceId('550e8400-e29b-41d4-a716-446655440000');
      expect(Array.isArray(found)).toBe(true);
      expect(found.length).toBe(0);
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

  describe('validation', () => {
    describe('create validation', () => {
      test('rejects product with name too short', async () => {
        try {
          await productRepo.create({
            name: 'ab',
            barcode: TEST_BARCODE,
            sourceId: testSource.id,
          });
          throw new Error('Expected validation error');
        } catch (error) {
          expect(error).toBeInstanceOf(EntityValidationError);
          expect((error as Error).message).toContain('Validation failed');
        }
      });

      test('rejects product with invalid name types', async () => {
        const invalidNames = [null, undefined, 123, {}, [], true];
        for (const name of invalidNames) {
          try {
            await productRepo.create({
              name: name as any,
              barcode: TEST_BARCODE,
              sourceId: testSource.id,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('rejects product with invalid barcode types', async () => {
        const invalidBarcodes = [null, undefined, 123, {}, [], true];
        for (const barcode of invalidBarcodes) {
          try {
            await productRepo.create({
              name: TEST_PRODUCT_NAME,
              barcode: barcode as any,
              sourceId: testSource.id,
            });
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('accepts valid product names', async () => {
        const validNames = ['abc', 'Valid Product', 'Product With 123', 'Long Product Name Here'];
        for (const name of validNames) {
          const product = await productRepo.create({
            name,
            barcode: `${Math.floor(Math.random() * 10000000000000)}`,
            sourceId: testSource.id,
          });
          expect(product.name).toBe(name);
        }
      });
    });

    describe('update validation', () => {
      test('rejects update with name too short', async () => {
        const created = await productRepo.create({
          name: TEST_PRODUCT_NAME,
          barcode: TEST_BARCODE,
          sourceId: testSource.id,
        });

        try {
          await productRepo.update(created.id, {name: 'ab'});
          throw new Error('Expected validation error');
        } catch (error) {
          expect(error).toBeInstanceOf(EntityValidationError);
          expect((error as Error).message).toContain('Validation failed');
        }
      });

      test('rejects update with invalid name types', async () => {
        const created = await productRepo.create({
          name: TEST_PRODUCT_NAME,
          barcode: TEST_BARCODE,
          sourceId: testSource.id,
        });

        const invalidNames = [null, 123, {}, [], true];
        for (const name of invalidNames) {
          try {
            await productRepo.update(created.id, {name: name as any});
            throw new Error('Expected validation error');
          } catch (error) {
            expect(error).toBeInstanceOf(EntityValidationError);
            expect((error as Error).message).toContain('Validation failed');
          }
        }
      });

      test('rejects update with invalid barcode types', async () => {
        const created = await productRepo.create({
          name: TEST_PRODUCT_NAME,
          barcode: TEST_BARCODE,
          sourceId: testSource.id,
        });

        const invalidBarcodes = [null, 123, {}, [], true];
        for (const barcode of invalidBarcodes) {
          try {
            await productRepo.update(created.id, {barcode: barcode as any});
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
