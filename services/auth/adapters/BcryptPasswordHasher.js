'use strict';

const bcrypt = require('bcryptjs');
const PasswordHasher = require('../domain/PasswordHasher');

const DEFAULT_SALT_ROUNDS = 10;

class BcryptPasswordHasher extends PasswordHasher {
  /**
   * @param {Object} [options]
   * @param {number} [options.saltRounds=10]
   */
  constructor({ saltRounds = DEFAULT_SALT_ROUNDS } = {}) {
    super();
    this.saltRounds = saltRounds;
  }

  /**
   * Hashes a plain text password.
   * @param {string} plainPassword
   * @returns {Promise<string>}
   */
  async hash(plainPassword) {
    if (!plainPassword || typeof plainPassword !== 'string') {
      throw new Error('password is required');
    }
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  /**
   * Compares a plain text password against a hashed password.
   * @param {string} plainPassword
   * @param {string} hashedPassword
   * @returns {Promise<boolean>}
   */
  async compare(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      return false;
    }
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = BcryptPasswordHasher;
