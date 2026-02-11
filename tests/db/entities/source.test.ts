import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {Source, SourceName} from '../../../src/db/entities/source';

const initBase = (s: Source) => {
  s.id = '550e8400-e29b-41d4-a716-446655440000';
  s.createdAt = new Date();
  s.updatedAt = new Date();
  s.deletedAt = null;
};

describe('Source Entity Tests', () => {
  test('Source entity columns are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === Source);

    const nameColumn = columns.find(c => c.propertyName === 'name');
    expect(nameColumn).toBeDefined();
    expect(nameColumn?.options.type).toBe('enum');
    expect(nameColumn?.options.enum).toBe(SourceName);

    const urlColumn = columns.find(c => c.propertyName === 'url');
    expect(urlColumn).toBeDefined();
    expect(urlColumn?.options.type).toBe('tinytext');

    const relations = getMetadataArgsStorage().relations.filter(r => r.target === Source);
    const productsRelation = relations.find(r => r.propertyName === 'products');
    expect(productsRelation).toBeDefined();
    expect(productsRelation?.relationType).toBe('one-to-many');
  });

  test('Source entity validator enforces constraints', async () => {
    const source = new Source();
    initBase(source);

    source.name = SourceName.USER_ENTERED;
    source.url = 'https://example.com';
    expect(await validate(source)).toHaveLength(0);

    source.name = SourceName.BARCODE_INDEX;
    for (const bad of ['not-a-url', 'http//missing-colon', '', 123, {}, []]) {
      (source as any).url = bad;
      const errors = await validate(source);
      expect(errors.some(e => e.property === 'url')).toBe(true);
    }
  });

  describe('Source fuzzing', () => {
    test('url fuzzing rejects invalid values', async () => {
      const source = new Source();
      initBase(source);
      source.name = SourceName.USER_ENTERED;

      const cases = ['not-a-url', 'http//missing-colon', '', 123, {}, []];
      for (const value of cases) {
        (source as any).url = value;
        const errors = await validate(source);
        expect(errors.some(e => e.property === 'url')).toBe(true);
      }
    });
  });
});
