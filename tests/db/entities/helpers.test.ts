import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {UUIDv4Entity, TimestampedEntity, SoftDeleteEntity} from '../../../src/db/entities/helpers';

describe('Entity Helpers Tests', () => {
  test('UUIDv4Entity defines UUID primary column correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      c => c.target === UUIDv4Entity && c.propertyName === 'id',
    );

    expect(columns.length).toBe(1);
    expect(columns[0].options.primary).toBe(true);
    expect(columns[0].options.type).toBe('uuid');

    expect(Reflect.getMetadata('design:type', UUIDv4Entity.prototype, 'id')).toBe(String);
  });

  test('TimestampedEntity defines createdAt and updatedAt columns correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === TimestampedEntity);

    const names = columns.map(c => c.propertyName);
    expect(names).toContain('createdAt');
    expect(names).toContain('updatedAt');

    expect(Reflect.getMetadata('design:type', TimestampedEntity.prototype, 'createdAt')).toBe(Date);
    expect(Reflect.getMetadata('design:type', TimestampedEntity.prototype, 'updatedAt')).toBe(Date);
  });

  test('SoftDeleteEntity defines nullable deletedAt column correctly', () => {
    const column = getMetadataArgsStorage().columns.find(
      c => c.target === SoftDeleteEntity && c.propertyName === 'deletedAt',
    );

    expect(column).toBeDefined();
    expect(column?.options.nullable).toBe(true);

    const deletedAtType = Reflect.getMetadata(
      'design:type',
      SoftDeleteEntity.prototype,
      'deletedAt',
    );

    expect([Object, Date]).toContain(deletedAtType);
  });

  test('UUIDv4Entity validator rejects invalid IDs and accepts valid UUIDv4', async () => {
    const good = new (class extends UUIDv4Entity {})();
    good.id = '550e8400-e29b-41d4-a716-446655440000';
    expect(await validate(good)).toHaveLength(0);

    const badInputs: any[] = [
      'not-a-uuid',
      '550e8400-e29b-11d4-a716-446655440000',
      '550e8400e29b41d4a716446655440000',
      '',
      '   ',
      123,
      null,
      {},
      [],
      true,
    ];

    for (const val of badInputs) {
      const e = new (class extends UUIDv4Entity {})();
      e.id = val;
      const errs = await validate(e);
      expect(errs.length).toBeGreaterThan(0);
      expect(errs.some(er => er.property === 'id')).toBe(true);
    }
  });

  test('TimestampedEntity validator enforces Date types for createdAt/updatedAt', async () => {
    const ok = new (class extends TimestampedEntity {})();
    ok.id = '550e8400-e29b-41d4-a716-446655440000';
    ok.createdAt = new Date();
    ok.updatedAt = new Date();

    expect(await validate(ok)).toHaveLength(0);

    const badInputs: any[] = ['date', 123, {}, [], true];

    for (const val of badInputs) {
      const e = new (class extends TimestampedEntity {})();
      e.id = '550e8400-e29b-41d4-a716-446655440000';
      e.createdAt = val;
      e.updatedAt = val;

      const errs = await validate(e);
      expect(errs.length).toBeGreaterThan(0);
      expect(errs.some(er => er.property === 'createdAt' || er.property === 'updatedAt')).toBe(
        true,
      );
    }
  });

  test('SoftDeleteEntity validator allows null/Date for deletedAt and rejects other types', async () => {
    const baseId = '550e8400-e29b-41d4-a716-446655440000';

    const okNull = new (class extends SoftDeleteEntity {})();
    okNull.id = baseId;
    okNull.createdAt = new Date();
    okNull.updatedAt = new Date();
    okNull.deletedAt = null;
    expect(await validate(okNull)).toHaveLength(0);

    const okDate = new (class extends SoftDeleteEntity {})();
    okDate.id = baseId;
    okDate.createdAt = new Date();
    okDate.updatedAt = new Date();
    okDate.deletedAt = new Date();
    expect(await validate(okDate)).toHaveLength(0);

    const badInputs: any[] = ['date', 123, {}, [], true];

    for (const val of badInputs) {
      const e = new (class extends SoftDeleteEntity {})();
      e.id = baseId;
      e.createdAt = new Date();
      e.updatedAt = new Date();
      e.deletedAt = val;

      const errs = await validate(e);
      expect(errs.length).toBeGreaterThan(0);
      expect(errs.some(er => er.property === 'deletedAt')).toBe(true);
    }
  });
});
