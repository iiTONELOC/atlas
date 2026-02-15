import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {Product} from '../../../src/entities/product';

const initBase = (p: Product) => {
  p.id = '550e8400-e29b-41d4-a716-446655440000';
  p.createdAt = new Date();
  p.updatedAt = new Date();
  p.deletedAt = null;
};

describe('Product Entity Tests', () => {
  test('Product entity columns are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === Product);

    const nameColumn = columns.find(c => c.propertyName === 'name');
    expect(nameColumn).toBeDefined();
    expect(nameColumn?.options.type).toBe('tinytext');

    const barcodeColumn = columns.find(c => c.propertyName === 'barcode');
    expect(barcodeColumn).toBeDefined();
    expect(barcodeColumn?.options.type).toBe('varchar');
    expect(barcodeColumn?.options.length).toBe(13);
    expect(barcodeColumn?.options.unique).toBe(true);

    const relations = getMetadataArgsStorage().relations.filter(r => r.target === Product);
    const sourceRelation = relations.find(r => r.propertyName === 'source');
    expect(sourceRelation).toBeDefined();
    expect(sourceRelation?.relationType).toBe('many-to-one');
  });

  test('Product entity validator enforces constraints', async () => {
    const product = new Product();
    initBase(product);

    product.name = 'Milk';
    product.barcode = '1234567890123';
    expect(await validate(product)).toHaveLength(0);

    product.name = 'ab';
    let errors = await validate(product);
    expect(errors.some(e => e.property === 'name')).toBe(true);

    product.name = 'ValidName';
    for (const bad of [null, undefined, 123, {}, [], true]) {
      (product as any).barcode = bad;
      errors = await validate(product);
      expect(errors.some(e => e.property === 'barcode')).toBe(true);
    }
  });

  describe('Product fuzzing', () => {
    test('name fuzzing rejects invalid values', async () => {
      const product = new Product();
      initBase(product);

      const cases = ['', 'ab', null, undefined, 123, {}, [], true];
      for (const value of cases) {
        (product as any).name = value;
        const errors = await validate(product);
        expect(errors.some(e => e.property === 'name')).toBe(true);
      }
    });

    test('barcode fuzzing rejects invalid values', async () => {
      const product = new Product();
      initBase(product);
      product.name = 'FuzzProduct';

      const cases = [null, undefined, 123, {}, [], true];
      for (const value of cases) {
        (product as any).barcode = value;
        const errors = await validate(product);
        expect(errors.some(e => e.property === 'barcode')).toBe(true);
      }
    });
  });
});
