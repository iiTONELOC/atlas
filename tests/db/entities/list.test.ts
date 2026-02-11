import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {List} from '../../../src/db/entities/list';

const initBase = (l: List) => {
  l.id = '550e8400-e29b-41d4-a716-446655440000';
  l.createdAt = new Date();
  l.updatedAt = new Date();
  l.deletedAt = null;
};

describe('List Entity Tests', () => {
  test('List entity columns are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === List);

    const nameColumn = columns.find(c => c.propertyName === 'name');
    expect(nameColumn).toBeDefined();
    expect(nameColumn?.options.type).toBe('tinytext');

    const isDefaultColumn = columns.find(c => c.propertyName === 'isDefault');
    expect(isDefaultColumn).toBeDefined();
    expect(isDefaultColumn?.options.type).toBe('boolean');
    expect(isDefaultColumn?.options.default).toBe(false);

    const relations = getMetadataArgsStorage().relations.filter(r => r.target === List);
    const userRelation = relations.find(r => r.propertyName === 'user');
    expect(userRelation).toBeDefined();
    expect(userRelation?.relationType).toBe('many-to-one');

    const itemsRelation = relations.find(r => r.propertyName === 'items');
    expect(itemsRelation).toBeDefined();
    expect(itemsRelation?.relationType).toBe('one-to-many');
  });

  test('List entity validator enforces constraints', async () => {
    const list = new List();
    initBase(list);

    list.name = 'Groceries';
    list.isDefault = false;
    expect(await validate(list)).toHaveLength(0);

    list.name = '';
    let errors = await validate(list);
    expect(errors.some(e => e.property === 'name')).toBe(true);

    list.name = 'a'.repeat(256);
    errors = await validate(list);
    expect(errors.some(e => e.property === 'name')).toBe(true);

    list.name = 'ValidName';
    for (const bad of ['true', 1, 0, null, undefined, {}, []]) {
      (list as any).isDefault = bad;
      errors = await validate(list);
      expect(errors.some(e => e.property === 'isDefault')).toBe(true);
    }
  });

  describe('List fuzzing', () => {
    test('name fuzzing rejects invalid values', async () => {
      const list = new List();
      initBase(list);

      const cases = ['', 'a'.repeat(256), 123, {}, [], true];
      for (const value of cases) {
        (list as any).name = value;
        const errors = await validate(list);
        expect(errors.some(e => e.property === 'name')).toBe(true);
      }
    });

    test('isDefault fuzzing rejects invalid values', async () => {
      const list = new List();
      initBase(list);
      list.name = 'FuzzList';

      const cases = ['', 'yes', 'no', 1, 0, {}, []];
      for (const value of cases) {
        (list as any).isDefault = value;
        const errors = await validate(list);
        expect(errors.some(e => e.property === 'isDefault')).toBe(true);
      }
    });
  });
});
