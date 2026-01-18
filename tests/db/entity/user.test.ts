import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {AccountStatus, User} from '../../../src/db/entity/user';

describe('User Entity Tests', () => {
  test('User entity columns are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === User);

    const accountStatusColumn = columns.find(c => c.propertyName === 'accountStatus');
    expect(accountStatusColumn).toBeDefined();
    expect(accountStatusColumn?.options.type).toBe('enum');
    expect(accountStatusColumn?.options.enum).toBe(AccountStatus);
    expect(accountStatusColumn?.options.default).toBe(AccountStatus.PENDING);

    const displayNameColumn = columns.find(c => c.propertyName === 'displayName');
    expect(displayNameColumn).toBeDefined();
    expect(displayNameColumn?.options.type).toBe('tinytext');
    expect(displayNameColumn?.options.nullable).toBe(true);
    expect(displayNameColumn?.options.default).toBe(null);
  });

  test('User entity validator enforces constraints', async () => {
    const user = new User();

    // initialize required inherited fields
    user.id = '550e8400-e29b-41d4-a716-446655440000';
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.deletedAt = null;

    // defaults
    expect(user.accountStatus).toBe(AccountStatus.PENDING);
    expect(user.displayName).toBeNull();

    // valid
    user.accountStatus = AccountStatus.ACTIVE;
    user.displayName = 'ValidName123';
    expect(await validate(user)).toHaveLength(0);

    // invalid account status
    (user as any).accountStatus = 'INVALID_STATUS';
    let errors = await validate(user);
    expect(errors.some(e => e.property === 'accountStatus')).toBe(true);

    // invalid display name
    user.accountStatus = AccountStatus.ACTIVE;
    user.displayName = 'Invalid Name!@#';
    errors = await validate(user);
    expect(errors.some(e => e.property === 'displayName')).toBe(true);

    // null and undefined displayName allowed
    user.displayName = null;
    expect(await validate(user)).toHaveLength(0);
    (user as any).displayName = undefined;
    expect(await validate(user)).toHaveLength(0);

    // tinytext length not validated by class-validator
    user.displayName = 'a'.repeat(300);
    expect(await validate(user)).toHaveLength(0);
  });

  test('Inherited validators from SoftDeleteEntity are enforced', async () => {
    const user = new User();

    (user as any).id = 'not-a-uuid';
    user.createdAt = new Date();
    user.updatedAt = new Date();
    let errors = await validate(user);
    expect(errors.some(e => e.property === 'id')).toBe(true);

    user.id = '550e8400-e29b-41d4-a716-446655440000';
    (user as any).createdAt = 'not-a-date';
    (user as any).updatedAt = 123;
    errors = await validate(user);
    expect(errors.some(e => e.property === 'createdAt')).toBe(true);
    expect(errors.some(e => e.property === 'updatedAt')).toBe(true);

    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.deletedAt = null;
    expect(await validate(user)).toHaveLength(0);

    user.deletedAt = new Date();
    expect(await validate(user)).toHaveLength(0);

    (user as any).deletedAt = 'not-a-date';
    errors = await validate(user);
    expect(errors.some(e => e.property === 'deletedAt')).toBe(true);
  });

  test('AccountStatus enum fuzzing', async () => {
    const user = new User();
    user.id = '550e8400-e29b-41d4-a716-446655440000';
    user.createdAt = new Date();
    user.updatedAt = new Date();

    for (const bad of [null, undefined, 123, {}, [], 'active', 'DELET', '']) {
      (user as any).accountStatus = bad;
      const errors = await validate(user);
      expect(errors.some(e => e.property === 'accountStatus')).toBe(true);
    }
  });

  test('displayName alphanumeric fuzzing', async () => {
    const user = new User();
    user.id = '550e8400-e29b-41d4-a716-446655440000';
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.accountStatus = AccountStatus.ACTIVE;

    // valid cases
    for (const ok of ['abc', 'ABC123', 'name123', null, undefined]) {
      (user as any).displayName = ok;
      expect(await validate(user)).toHaveLength(0);
    }

    // invalid cases
    for (const bad of [
      'with space',
      'with-dash',
      'with_underscore',
      'with.dot',
      'with@symbol',
      'with!bang',
      '汉字',
      'emoji😀',
      '',
      123,
      {},
      [],
    ]) {
      (user as any).displayName = bad;
      const errors = await validate(user);
      expect(errors.some(e => e.property === 'displayName')).toBe(true);
    }
  });
});
