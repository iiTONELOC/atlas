import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {Session} from '../../../src/db/entities/session';

const initBase = (s: Session) => {
  s.id = '550e8400-e29b-41d4-a716-446655440000';
  s.createdAt = new Date();
  s.updatedAt = new Date();
};

describe('Session Entity Tests', () => {
  test('Session entity columns are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === Session);

    const expiresAtColumn = columns.find(c => c.propertyName === 'expiresAt');
    expect(expiresAtColumn).toBeDefined();
    expect(expiresAtColumn?.options.type).toBe('datetime');

    const isRevokedColumn = columns.find(c => c.propertyName === 'isRevoked');
    expect(isRevokedColumn).toBeDefined();
    expect(isRevokedColumn?.options.type).toBe('boolean');
    expect(isRevokedColumn?.options.default).toBe(false);

    const userAgentColumn = columns.find(c => c.propertyName === 'userAgent');
    expect(userAgentColumn).toBeDefined();
    expect(userAgentColumn?.options.type).toBe('tinytext');

    const ipAddressColumn = columns.find(c => c.propertyName === 'ipAddress');
    expect(ipAddressColumn).toBeDefined();
    expect(ipAddressColumn?.options.type).toBe('varchar');
    expect(ipAddressColumn?.options.length).toBe(45);

    const relations = getMetadataArgsStorage().relations.filter(r => r.target === Session);
    const userRelation = relations.find(r => r.propertyName === 'user');
    expect(userRelation).toBeDefined();
    expect(userRelation?.relationType).toBe('many-to-one');

    const tokenRelation = relations.find(r => r.propertyName === 'token');
    expect(tokenRelation).toBeDefined();
    expect(tokenRelation?.relationType).toBe('one-to-one');
    expect((tokenRelation?.options as any).cascade).toBe(true);

    const joinColumns = getMetadataArgsStorage().joinColumns.filter(j => j.target === Session);
    const tokenJoinColumn = joinColumns.find(j => j.propertyName === 'token');
    expect(tokenJoinColumn).toBeDefined();
  });

  test('Session entity validator enforces constraints', async () => {
    const session = new Session();
    initBase(session);

    // defaults
    expect(session.isRevoked).toBe(false);

    // valid
    session.expiresAt = new Date(Date.now() + 3600000);
    session.isRevoked = false;
    session.userAgent = 'Mozilla/5.0';
    session.ipAddress = '192.168.1.1';
    expect(await validate(session)).toHaveLength(0);

    // valid with IPv6
    session.ipAddress = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    expect(await validate(session)).toHaveLength(0);
  });

  test('Invalid expiresAt is rejected', async () => {
    const session = new Session();
    initBase(session);
    session.isRevoked = false;
    session.userAgent = 'Mozilla/5.0';
    session.ipAddress = '192.168.1.1';

    (session as any).expiresAt = 'not-a-date';
    let errors = await validate(session);
    expect(errors.some(e => e.property === 'expiresAt')).toBe(true);

    (session as any).expiresAt = 123;
    errors = await validate(session);
    expect(errors.some(e => e.property === 'expiresAt')).toBe(true);

    session.expiresAt = new Date();
    expect(await validate(session)).toHaveLength(0);
  });

  test('Invalid isRevoked is rejected', async () => {
    const session = new Session();
    initBase(session);
    session.expiresAt = new Date();
    session.userAgent = 'Mozilla/5.0';
    session.ipAddress = '192.168.1.1';

    for (const bad of ['true', 'false', 1, 0, null, undefined, {}, []]) {
      (session as any).isRevoked = bad;
      const errors = await validate(session);
      expect(errors.some(e => e.property === 'isRevoked')).toBe(true);
    }

    session.isRevoked = true;
    expect(await validate(session)).toHaveLength(0);

    session.isRevoked = false;
    expect(await validate(session)).toHaveLength(0);
  });

  test('userAgent validation enforces required string with length', async () => {
    const session = new Session();
    initBase(session);
    session.expiresAt = new Date();
    session.isRevoked = false;
    session.ipAddress = '192.168.1.1';

    // valid strings
    const validUserAgents = [
      'Mozilla/5.0',
      'Chrome/91.0.4472.124',
      'Safari/537.36',
      'a'.repeat(255),
    ];

    for (const ua of validUserAgents) {
      session.userAgent = ua;
      expect(await validate(session)).toHaveLength(0);
    }

    // too long
    session.userAgent = 'a'.repeat(256);
    let errors = await validate(session);
    expect(errors.some(e => e.property === 'userAgent')).toBe(true);

    // empty string
    session.userAgent = '';
    errors = await validate(session);
    expect(errors.some(e => e.property === 'userAgent')).toBe(true);
  });

  test('ipAddress validation requires valid IP', async () => {
    const session = new Session();
    initBase(session);
    session.expiresAt = new Date();
    session.isRevoked = false;
    session.userAgent = 'Mozilla/5.0';

    // valid IPv4
    const validIPs = ['0.0.0.0', '127.0.0.1', '192.168.1.1', '255.255.255.255', '10.0.0.1'];

    for (const ip of validIPs) {
      session.ipAddress = ip;
      expect(await validate(session)).toHaveLength(0);
    }

    // valid IPv6
    const validIPv6s = ['2001:0db8:85a3:0000:0000:8a2e:0370:7334', '::1', 'fe80::1', '::'];

    for (const ip of validIPv6s) {
      session.ipAddress = ip;
      expect(await validate(session)).toHaveLength(0);
    }

    // invalid IPs
    const invalidIPs = ['not-an-ip', '999.999.999.999', '192.168.1', 'hello', ''];

    for (const ip of invalidIPs) {
      session.ipAddress = ip;
      const errors = await validate(session);
      expect(errors.some(e => e.property === 'ipAddress')).toBe(true);
    }
  });

  test('Inherited validators from TimestampedEntity are enforced', async () => {
    const session = new Session();
    session.expiresAt = new Date();
    session.isRevoked = false;
    session.userAgent = 'Mozilla/5.0';
    session.ipAddress = '192.168.1.1';

    (session as any).id = 'not-a-uuid';
    session.createdAt = new Date();
    session.updatedAt = new Date();
    let errors = await validate(session);
    expect(errors.some(e => e.property === 'id')).toBe(true);

    session.id = '550e8400-e29b-41d4-a716-446655440000';
    (session as any).createdAt = 'not-a-date';
    errors = await validate(session);
    expect(errors.some(e => e.property === 'createdAt')).toBe(true);

    session.createdAt = new Date();
    (session as any).updatedAt = 123;
    errors = await validate(session);
    expect(errors.some(e => e.property === 'updatedAt')).toBe(true);

    session.updatedAt = new Date();
    expect(await validate(session)).toHaveLength(0);
  });

  test('Session fuzzing with various invalid values', async () => {
    const session = new Session();
    initBase(session);
    session.userAgent = 'Mozilla/5.0';
    session.ipAddress = '192.168.1.1';

    // fuzz expiresAt
    for (const bad of [null, undefined, '', 'date', 123, {}, []]) {
      (session as any).expiresAt = bad;
      const errors = await validate(session);
      expect(errors.some(e => e.property === 'expiresAt')).toBe(true);
    }

    // fuzz isRevoked
    session.expiresAt = new Date();
    for (const bad of [null, undefined, '', 'true', 1, 0, {}, []]) {
      (session as any).isRevoked = bad;
      const errors = await validate(session);
      expect(errors.some(e => e.property === 'isRevoked')).toBe(true);
    }

    // fuzz userAgent with non-strings
    session.isRevoked = false;
    for (const bad of [null, undefined, 123, {}, [], true]) {
      (session as any).userAgent = bad;
      const errors = await validate(session);
      expect(errors.some(e => e.property === 'userAgent')).toBe(true);
    }

    // fuzz ipAddress with invalid types
    session.userAgent = 'Mozilla/5.0';
    for (const bad of [null, undefined, 123, {}, [], true, 'not-an-ip', '999.999.999.999']) {
      (session as any).ipAddress = bad;
      const errors = await validate(session);
      expect(errors.some(e => e.property === 'ipAddress')).toBe(true);
    }
  });
});
