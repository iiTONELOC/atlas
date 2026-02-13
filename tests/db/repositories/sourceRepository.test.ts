import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {DataSource} from 'typeorm';
import {Source, SourceName} from '../../../src/db/entities';
import {getSourceRepository, SourceRepository} from '../../../src/db/repositories/sourceRepository';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';

const TEST_SOURCE_NAME = SourceName.BARCODE_INDEX;
const TEST_SOURCE_URL = 'https://example.com/barcode';

describe('SourceRepository', () => {
  let dataSource: DataSource;
  let sourceRepo: SourceRepository;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    sourceRepo = getSourceRepository(dataSource.getRepository(Source));
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE source');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('create', () => {
    test('creates source with name and url', async () => {
      const source = await sourceRepo.create({
        name: TEST_SOURCE_NAME as any,
        url: TEST_SOURCE_URL,
      });

      expect(source.id).toBeDefined();
      expect(source.name).toBe(TEST_SOURCE_NAME);
      expect(source.url).toBe(TEST_SOURCE_URL);
      expect(source.createdAt).toBeDefined();
      expect(source.updatedAt).toBeDefined();
      expect(source.deletedAt).toBeNull();
    });

    test('creates multiple sources with different names', async () => {
      const source1 = await sourceRepo.create({
        name: SourceName.BARCODE_INDEX,
        url: 'https://example1.com',
      });

      const source2 = await sourceRepo.create({
        name: SourceName.UPC_ITEM_DB,
        url: 'https://example2.com',
      });

      expect(source1.id).not.toBe(source2.id);
      expect(source1.name).not.toBe(source2.name);
    });

    test('creates sources with different URLs', async () => {
      const source1 = await sourceRepo.create({
        name: SourceName.BARCODE_INDEX,
        url: 'https://example1.com',
      });

      const source2 = await sourceRepo.create({
        name: SourceName.BARCODE_INDEX,
        url: 'https://example2.com',
      });

      expect(source1.url).not.toBe(source2.url);
    });
  });

  describe('findById', () => {
    test('finds source by id', async () => {
      const created = await sourceRepo.create({
        name: TEST_SOURCE_NAME as any,
        url: TEST_SOURCE_URL,
      });

      const found = await sourceRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe(TEST_SOURCE_NAME);
    });

    test('returns null for non-existent id', async () => {
      const found = await sourceRepo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    test('returns null for invalid uuid format', async () => {
      const found = await sourceRepo.findById('not-a-uuid');
      expect(found).toBeNull();
    });

    test('deletes source without hard removing', async () => {
      const created = await sourceRepo.create({
        name: TEST_SOURCE_NAME as any,
        url: TEST_SOURCE_URL,
      });

      expect(created.deletedAt).toBeNull();

      // Soft delete
      await sourceRepo.delete(created.id);

      // Source still exists in database (soft delete)
      const found = await sourceRepo.findById(created.id);
      expect(found).toBeDefined();
    });
  });

  describe('update', () => {
    test('updates source url', async () => {
      const created = await sourceRepo.create({
        name: TEST_SOURCE_NAME as any,
        url: TEST_SOURCE_URL,
      });

      const newUrl = 'https://updated.com/api';
      const updated = await sourceRepo.update(created.id, {
        url: newUrl,
      });

      expect(updated.url).toBe(newUrl);
      expect(updated.name).toBe(TEST_SOURCE_NAME);
    });

    test('updates source name', async () => {
      const created = await sourceRepo.create({
        name: SourceName.BARCODE_INDEX,
        url: TEST_SOURCE_URL,
      });

      const updated = await sourceRepo.update(created.id, {
        name: SourceName.UPC_ITEM_DB,
      });

      expect(updated.name).toBe(SourceName.UPC_ITEM_DB);
      expect(updated.url).toBe(TEST_SOURCE_URL);
    });

    test('updates only url without changing name', async () => {
      const created = await sourceRepo.create({
        name: TEST_SOURCE_NAME as any,
        url: TEST_SOURCE_URL,
      });

      const updated = await sourceRepo.update(created.id, {
        url: 'https://different.com',
      });

      expect(updated.name).toBe(TEST_SOURCE_NAME);
      expect(updated.url).toBe('https://different.com');
    });

    test('updates only name without changing url', async () => {
      const created = await sourceRepo.create({
        name: SourceName.BARCODE_INDEX,
        url: TEST_SOURCE_URL,
      });

      const updated = await sourceRepo.update(created.id, {
        name: SourceName.BARCODE_SPIDER,
      });

      expect(updated.name).toBe(SourceName.BARCODE_SPIDER);
      expect(updated.url).toBe(TEST_SOURCE_URL);
    });

    test('updates both name and url', async () => {
      const created = await sourceRepo.create({
        name: SourceName.BARCODE_INDEX,
        url: TEST_SOURCE_URL,
      });

      const updated = await sourceRepo.update(created.id, {
        name: SourceName.UPC_ITEM_DB,
        url: 'https://totally-new.com',
      });

      expect(updated.name).toBe(SourceName.UPC_ITEM_DB);
      expect(updated.url).toBe('https://totally-new.com');
    });

    test('throws error for non-existent source', async () => {
      await expect(
        sourceRepo.update('550e8400-e29b-41d4-a716-446655440000', {
          url: 'https://example.com',
        }),
      ).rejects.toThrow('Source not found');
    });

    test('preserves createdAt on update', async () => {
      const created = await sourceRepo.create({
        name: TEST_SOURCE_NAME as any,
        url: TEST_SOURCE_URL,
      });

      const createdAt = created.createdAt;

      const updated = await sourceRepo.update(created.id, {
        url: 'https://new.com',
      });

      expect(updated.createdAt).toEqual(createdAt);
    });

    test('updates updatedAt on update', async () => {
      const created = await sourceRepo.create({
        name: TEST_SOURCE_NAME as any,
        url: TEST_SOURCE_URL,
      });

      const updated = await sourceRepo.update(created.id, {
        url: 'https://new.com',
      });

      expect(updated.updatedAt).toBeDefined();
      expect(updated.updatedAt instanceof Date).toBe(true);
      expect(updated.url).toBe('https://new.com');
    });
  });

  describe('delete', () => {
    test('deletes existing source', async () => {
      const created = await sourceRepo.create({
        name: TEST_SOURCE_NAME as any,
        url: TEST_SOURCE_URL,
      });

      await sourceRepo.delete(created.id);

      expect(created.deletedAt).toBeNull();
    });

    test('throws error for non-existent source', async () => {
      await expect(sourceRepo.delete('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'Source not found',
      );
    });
  });

  describe('validation', () => {
    describe('create validation', () => {
      test('rejects source with invalid url format', async () => {
        const invalidUrls = ['not-a-url', 'htp://bad', 'ftp only', 'no-protocol.com'];
        for (const url of invalidUrls) {
          await expect(
            sourceRepo.create({
              name: TEST_SOURCE_NAME,
              url,
            }),
          ).rejects.toThrow('Validation failed');
        }
      });

      test('rejects source with invalid url types', async () => {
        const invalidUrls = [null, undefined, 123, {}, [], true];
        for (const url of invalidUrls) {
          await expect(
            sourceRepo.create({
              name: TEST_SOURCE_NAME,
              url: url as any,
            }),
          ).rejects.toThrow('Validation failed');
        }
      });

      test('accepts valid url formats', async () => {
        const validUrls = [
          'https://example.com',
          'http://test.org/path',
          'https://sub.domain.com:8080/api',
        ];
        for (const url of validUrls) {
          const source = await sourceRepo.create({
            name: SourceName.BARCODE_INDEX,
            url,
          });
          expect(source.url).toBe(url);
        }
      });
    });

    describe('update validation', () => {
      test('rejects update with invalid url format', async () => {
        const created = await sourceRepo.create({
          name: TEST_SOURCE_NAME,
          url: TEST_SOURCE_URL,
        });

        const invalidUrls = ['not-a-url', 'htp://bad'];
        for (const url of invalidUrls) {
          await expect(sourceRepo.update(created.id, {url})).rejects.toThrow('Validation failed');
        }
      });

      test('rejects update with invalid url types', async () => {
        const created = await sourceRepo.create({
          name: TEST_SOURCE_NAME,
          url: TEST_SOURCE_URL,
        });

        const invalidUrls = [null, 123, {}, []];
        for (const url of invalidUrls) {
          await expect(sourceRepo.update(created.id, {url: url as any})).rejects.toThrow(
            'Validation failed',
          );
        }
      });
    });
  });
});
