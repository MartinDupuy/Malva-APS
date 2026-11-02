'use strict';

const PasswordHasher = require('../../services/auth/domain/PasswordHasher');
const BcryptPasswordHasher = require('../../services/auth/adapters/BcryptPasswordHasher');

describe('BcryptPasswordHasher adapter and PasswordHasher port', () => {
  const hasher = new BcryptPasswordHasher({ saltRounds: 6 }); // lower rounds for faster tests

  describe('PasswordHasher port contract', () => {
    test('unimplemented PasswordHasher should throw "Method not implemented."', async () => {
      const port = new PasswordHasher();
      await expect(port.hash('secret')).rejects.toThrow('Method not implemented.');
      await expect(port.compare('secret', 'hash')).rejects.toThrow('Method not implemented.');
    });

    test('BcryptPasswordHasher should inherit from PasswordHasher', () => {
      expect(hasher).toBeInstanceOf(PasswordHasher);
    });
  });

  describe('hash()', () => {
    test('should return a hashed string different from plain password', async () => {
      const plainPassword = 'mySecurePassword123!';
      const hash = await hasher.hash(plainPassword);

      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(plainPassword);
      expect(hash.startsWith('$2')).toBe(true);
    });

    test('should produce different hashes for the same password due to random salting', async () => {
      const plainPassword = 'identicalPassword';
      const hash1 = await hasher.hash(plainPassword);
      const hash2 = await hasher.hash(plainPassword);

      expect(hash1).not.toBe(hash2);
    });

    test('should throw error when plainPassword is missing or invalid', async () => {
      await expect(hasher.hash()).rejects.toThrow('password is required');
      await expect(hasher.hash('')).rejects.toThrow('password is required');
      await expect(hasher.hash(123)).rejects.toThrow('password is required');
    });
  });

  describe('compare()', () => {
    test('should return true when plain password matches the hash', async () => {
      const plainPassword = 'correctPassword';
      const hash = await hasher.hash(plainPassword);

      const isValid = await hasher.compare(plainPassword, hash);
      expect(isValid).toBe(true);
    });

    test('should return false when plain password does not match the hash', async () => {
      const plainPassword = 'correctPassword';
      const hash = await hasher.hash(plainPassword);

      const isValid = await hasher.compare('wrongPassword', hash);
      expect(isValid).toBe(false);
    });

    test('should return false when plainPassword or hash is null or empty', async () => {
      expect(await hasher.compare('', 'somehash')).toBe(false);
      expect(await hasher.compare('password', '')).toBe(false);
      expect(await hasher.compare(null, 'somehash')).toBe(false);
      expect(await hasher.compare('password', null)).toBe(false);
    });
  });
});
