'use strict';

const User = require('../../services/auth/domain/User');
const { ROLES } = require('../../services/auth/domain/Roles');

describe('User Entity', () => {
  const validUserData = {
    id: 'user-123456',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpasswordexample1234567890',
    name: 'Juan Perez',
    role: ROLES.PASSENGER,
    createdAt: new Date('2026-10-30T10:00:00Z'),
  };

  describe('User creation', () => {
    test('should create a valid user with all fields populated', () => {
      const user = new User(validUserData);

      expect(user.id).toBe('user-123456');
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('$2a$10$hashedpasswordexample1234567890');
      expect(user.name).toBe('Juan Perez');
      expect(user.role).toBe(ROLES.PASSENGER);
      expect(user.createdAt).toEqual(new Date('2026-10-30T10:00:00Z'));
    });

    test('should default role to PASSENGER if not provided', () => {
      const { role, ...dataWithoutRole } = validUserData;
      const user = new User(dataWithoutRole);

      expect(user.role).toBe(ROLES.PASSENGER);
    });

    test('should allow creating users with ADMIN and COUNTER_AGENT roles', () => {
      const admin = new User({ ...validUserData, role: ROLES.ADMIN });
      const counterAgent = new User({ ...validUserData, role: ROLES.COUNTER_AGENT });

      expect(admin.role).toBe(ROLES.ADMIN);
      expect(counterAgent.role).toBe(ROLES.COUNTER_AGENT);
    });

    test('should auto-generate id as UUID when not provided', () => {
      const { id, ...dataWithoutId } = validUserData;
      const user = new User(dataWithoutId);

      expect(typeof user.id).toBe('string');
      expect(user.id.length).toBeGreaterThan(0);
    });

    test('should auto-generate createdAt when not provided', () => {
      const { createdAt, ...dataWithoutCreatedAt } = validUserData;
      const before = Date.now();
      const user = new User(dataWithoutCreatedAt);
      const after = Date.now();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after);
    });

    test('should support positional arguments', () => {
      const user = new User(
        'user-pos-1',
        'pos@example.com',
        'hash12345',
        'Positional User',
        ROLES.ADMIN,
        new Date('2026-10-30T09:00:00Z')
      );

      expect(user.id).toBe('user-pos-1');
      expect(user.email).toBe('pos@example.com');
      expect(user.passwordHash).toBe('hash12345');
      expect(user.name).toBe('Positional User');
      expect(user.role).toBe(ROLES.ADMIN);
      expect(user.createdAt).toEqual(new Date('2026-10-30T09:00:00Z'));
    });

    test('should trim string values', () => {
      const user = new User({
        ...validUserData,
        email: '  trimmed@example.com  ',
        name: '  Trimmed Name  ',
        passwordHash: '  hash123  ',
      });

      expect(user.email).toBe('trimmed@example.com');
      expect(user.name).toBe('Trimmed Name');
      expect(user.passwordHash).toBe('hash123');
    });
  });

  describe('Validation of fields', () => {
    test('should throw error when name is missing or empty', () => {
      const { name, ...dataWithoutName } = validUserData;
      expect(() => new User(dataWithoutName)).toThrow('name is required');
      expect(() => new User({ ...validUserData, name: '' })).toThrow('name is required');
      expect(() => new User({ ...validUserData, name: '   ' })).toThrow('name is required');
    });

    test('should throw error when email is missing or has invalid format', () => {
      const { email, ...dataWithoutEmail } = validUserData;
      expect(() => new User(dataWithoutEmail)).toThrow('email must be a valid email address');
      expect(() => new User({ ...validUserData, email: 'invalid-email' })).toThrow('email must be a valid email address');
      expect(() => new User({ ...validUserData, email: 'missing-at.com' })).toThrow('email must be a valid email address');
      expect(() => new User({ ...validUserData, email: '@no-user.com' })).toThrow('email must be a valid email address');
      expect(() => new User({ ...validUserData, email: '' })).toThrow('email must be a valid email address');
    });

    test('should throw error when passwordHash is missing or empty', () => {
      const { passwordHash, ...dataWithoutHash } = validUserData;
      expect(() => new User(dataWithoutHash)).toThrow('passwordHash is required');
      expect(() => new User({ ...validUserData, passwordHash: '' })).toThrow('passwordHash is required');
      expect(() => new User({ ...validUserData, passwordHash: '   ' })).toThrow('passwordHash is required');
    });

    test('should throw error when role is invalid', () => {
      expect(() => new User({ ...validUserData, role: 'SUPERUSER' })).toThrow('invalid user role');
      expect(() => new User({ ...validUserData, role: 'passenger' })).toThrow('invalid user role');
    });

    test('should throw error when no arguments are provided', () => {
      expect(() => new User()).toThrow('name is required');
    });
  });

  describe('Immutability', () => {
    test('should be frozen and throw TypeError when mutating properties', () => {
      const user = new User(validUserData);

      expect(Object.isFrozen(user)).toBe(true);
      expect(() => {
        user.name = 'New Name';
      }).toThrow(TypeError);
      expect(() => {
        user.role = ROLES.ADMIN;
      }).toThrow(TypeError);
      expect(() => {
        user.extraField = 'illegal';
      }).toThrow(TypeError);
    });
  });
});
