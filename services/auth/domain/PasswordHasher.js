'use strict';

/**
 * PasswordHasher Interface (Port)
 *
 * In JS we don't have strict interfaces, so we define a class with methods that throw.
 * Adapters must implement this port.
 */
class PasswordHasher {
  /**
   * Hashes a plain text password.
   * @param {string} plainPassword
   * @returns {Promise<string>}
   */
  async hash(plainPassword) {
    throw new Error('Method not implemented.');
  }

  /**
   * Compares a plain text password against a hash.
   * @param {string} plainPassword
   * @param {string} hashedPassword
   * @returns {Promise<boolean>}
   */
  async compare(plainPassword, hashedPassword) {
    throw new Error('Method not implemented.');
  }
}

module.exports = PasswordHasher;
