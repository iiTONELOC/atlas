import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {ListItem} from '../../../src/db/entity/listItem';

const initBase = (i: ListItem) => {
  i.id = '550e8400-e29b-41d4-a716-446655440000';
  i.createdAt = new Date();
  i.updatedAt = new Date();
  i.deletedAt = null;
};

describe('ListItem Entity Tests', () => {
  test('ListItem entity columns are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === ListItem);

    const quantityColumn = columns.find(c => c.propertyName === 'quantity');
    expect(quantityColumn).toBeDefined();
    expect(quantityColumn?.options.type).toBe('int');
    expect(quantityColumn?.options.default).toBe(1);

    const notesColumn = columns.find(c => c.propertyName === 'notes');
    expect(notesColumn).toBeDefined();
    expect(notesColumn?.options.type).toBe('text');
    expect(notesColumn?.options.nullable).toBe(true);
    expect(notesColumn?.options.default).toBe(null);

    const isCompleteColumn = columns.find(c => c.propertyName === 'isComplete');
    expect(isCompleteColumn).toBeDefined();
    expect(isCompleteColumn?.options.type).toBe('boolean');
    expect(isCompleteColumn?.options.default).toBe(false);

    const relations = getMetadataArgsStorage().relations.filter(r => r.target === ListItem);
    const listRelation = relations.find(r => r.propertyName === 'list');
    expect(listRelation).toBeDefined();
    expect(listRelation?.relationType).toBe('many-to-one');

    const productRelation = relations.find(r => r.propertyName === 'product');
    expect(productRelation).toBeDefined();
    expect(productRelation?.relationType).toBe('many-to-one');
  });

  test('ListItem entity validator enforces constraints', async () => {
    const item = new ListItem();
    initBase(item);

    item.quantity = 1;
    item.notes = null;
    item.isComplete = false;
    expect(await validate(item)).toHaveLength(0);

    for (const bad of ['1', null, undefined, {}, [], true]) {
      (item as any).quantity = bad;
      const errors = await validate(item);
      expect(errors.some(e => e.property === 'quantity')).toBe(true);
    }

    item.quantity = 2;
    item.notes = 'Some notes';
    expect(await validate(item)).toHaveLength(0);

    for (const bad of [123, {}, [], true]) {
      (item as any).notes = bad;
      const errors = await validate(item);
      expect(errors.some(e => e.property === 'notes')).toBe(true);
    }

    item.notes = null;
    for (const bad of ['true', 1, 0, null, undefined, {}, []]) {
      (item as any).isComplete = bad;
      const errors = await validate(item);
      expect(errors.some(e => e.property === 'isComplete')).toBe(true);
    }
  });

  describe('ListItem fuzzing', () => {
    test('quantity fuzzing rejects invalid values', async () => {
      const item = new ListItem();
      initBase(item);

      const cases = ['', '1', null, undefined, {}, [], true];
      for (const value of cases) {
        (item as any).quantity = value;
        const errors = await validate(item);
        expect(errors.some(e => e.property === 'quantity')).toBe(true);
      }
    });

    test('notes fuzzing rejects invalid values', async () => {
      const item = new ListItem();
      initBase(item);

      const cases = [123, {}, [], true];
      for (const value of cases) {
        (item as any).notes = value;
        const errors = await validate(item);
        expect(errors.some(e => e.property === 'notes')).toBe(true);
      }
    });

    test('isComplete fuzzing rejects invalid values', async () => {
      const item = new ListItem();
      initBase(item);

      const cases = ['', 'true', 1, 0, null, undefined, {}, []];
      for (const value of cases) {
        (item as any).isComplete = value;
        const errors = await validate(item);
        expect(errors.some(e => e.property === 'isComplete')).toBe(true);
      }
    });
  });
});
