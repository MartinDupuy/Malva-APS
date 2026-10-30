'use strict';

const crypto = require('crypto');
const { ROLES, isValidRole } = require('./Roles');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class User {
  /**
   * @param {Object} [dataOrId]
   * @param {string} [dataOrId.id]
   * @param {string} dataOrId.email
   * @param {string} dataOrId.passwordHash
   * @param {string} dataOrId.name
   * @param {string} [dataOrId.role]
   * @param {Date|string} [dataOrId.createdAt]
   */
  constructor(dataOrId = {}, ...rest) {
    const data = this._parseInput(dataOrId, rest);
    this._validate(data);

    this.id = data.id || crypto.randomUUID();
    this.email = data.email.trim();
    this.passwordHash = data.passwordHash.trim();
    this.name = data.name.trim();
    this.role = data.role || ROLES.PASSENGER;
    this.createdAt = data.createdAt
      ? (data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt))
      : new Date();

    Object.freeze(this);
  }

  _parseInput(dataOrId, rest) {
    if (typeof dataOrId === 'object' && dataOrId !== null && !(dataOrId instanceof Date)) {
      return { ...dataOrId };
    }
    return {
      id: dataOrId,
      email: rest[0],
      passwordHash: rest[1],
      name: rest[2],
      role: rest[3],
      createdAt: rest[4],
    };
  }

  _validate(data) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      throw new Error('name is required');
    }
    if (!data.email || typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email.trim())) {
      throw new Error('email must be a valid email address');
    }
    if (!data.passwordHash || typeof data.passwordHash !== 'string' || data.passwordHash.trim() === '') {
      throw new Error('passwordHash is required');
    }
    if (data.role !== undefined && data.role !== null && !isValidRole(data.role)) {
      throw new Error('invalid user role');
    }
  }
}

module.exports = User;
