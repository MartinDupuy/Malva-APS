'use strict';

const { ROLES, ALL_ROLES, isValidRole } = require('../../services/auth/domain/Roles');

describe('Roles constants and isValidRole', () => {
  describe('ROLES definition', () => {
    test('should define the three core system roles', () => {
      expect(ROLES.PASSENGER).toBe('PASSENGER');
      expect(ROLES.ADMIN).toBe('ADMIN');
      expect(ROLES.COUNTER_AGENT).toBe('COUNTER_AGENT');
    });

    test('should have an immutable ROLES object', () => {
      expect(Object.isFrozen(ROLES)).toBe(true);
      expect(() => {
        ROLES.NEW_ROLE = 'TEST';
      }).toThrow();
      expect(() => {
        ROLES.PASSENGER = 'CHANGED';
      }).toThrow();
    });

    test('should expose ALL_ROLES as a frozen array containing all roles', () => {
      expect(Object.isFrozen(ALL_ROLES)).toBe(true);
      expect(ALL_ROLES).toEqual(['PASSENGER', 'ADMIN', 'COUNTER_AGENT']);
      expect(() => {
        ALL_ROLES.push('SUPERADMIN');
      }).toThrow();
    });
  });

  describe('isValidRole function', () => {
    test('should return true for valid roles', () => {
      expect(isValidRole(ROLES.PASSENGER)).toBe(true);
      expect(isValidRole(ROLES.ADMIN)).toBe(true);
      expect(isValidRole(ROLES.COUNTER_AGENT)).toBe(true);
      expect(isValidRole('PASSENGER')).toBe(true);
    });

    test('should return false for invalid roles or non-string inputs', () => {
      expect(isValidRole('SUPER_ADMIN')).toBe(false);
      expect(isValidRole('passenger')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
      expect(isValidRole(123)).toBe(false);
      expect(isValidRole({})).toBe(false);
    });
  });
});
