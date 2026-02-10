import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {UserProduct} from '../../../src/db/entity/userProduct';

const initBase = (u: UserProduct) => {
  u.id = '550e8400-e29b-41d4-a716-446655440000';
  u.createdAt = new Date();
  u.updatedAt = new Date();
  u.deletedAt = null;
};

describe('UserProduct Entity Tests', () => {
  test('UserProduct entity columns are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === UserProduct);

    const aliasColumn = columns.find(c => c.propertyName === 'productAlias');
    expect(aliasColumn).toBeDefined();
    expect(aliasColumn?.options.type).toBe('tinytext');
    expect(aliasColumn?.options.nullable).toBe(true);
    expect(aliasColumn?.options.default).toBe(null);

    const relations = getMetadataArgsStorage().relations.filter(r => r.target === UserProduct);
    const userRelation = relations.find(r => r.propertyName === 'user');
    expect(userRelation).toBeDefined();
    expect(userRelation?.relationType).toBe('many-to-one');

    const productRelation = relations.find(r => r.propertyName === 'productData');
    expect(productRelation).toBeDefined();
    expect(productRelation?.relationType).toBe('many-to-one');
  });

  test('UserProduct entity validator enforces constraints', async () => {
    const userProduct = new UserProduct();
    initBase(userProduct);

    userProduct.productAlias = null;
    expect(await validate(userProduct)).toHaveLength(0);

    userProduct.productAlias = 'My Alias';
    expect(await validate(userProduct)).toHaveLength(0);

    for (const bad of [123, {}, [], true]) {
      (userProduct as any).productAlias = bad;
      const errors = await validate(userProduct);
      expect(errors.some(e => e.property === 'productAlias')).toBe(true);
    }
  });

  describe('UserProduct fuzzing', () => {
    test('productAlias fuzzing rejects invalid values', async () => {
      const userProduct = new UserProduct();
      initBase(userProduct);

      const cases = [123, {}, [], true];
      for (const value of cases) {
        (userProduct as any).productAlias = value;
        const errors = await validate(userProduct);
        expect(errors.some(e => e.property === 'productAlias')).toBe(true);
      }
    });
  });
});
