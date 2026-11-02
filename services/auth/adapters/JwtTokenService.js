'use strict';

const jwt = require('jsonwebtoken');
const TokenService = require('../domain/TokenService');

const DEFAULT_EXPIRES_IN = '8h';

class JwtTokenService extends TokenService {
  /**
   * @param {Object} [options]
   * @param {string} [options.secret]
   * @param {string|number} [options.expiresIn='8h']
   */
  constructor({ secret = process.env.JWT_SECRET || 'malva-jwt-secret-key', expiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN } = {}) {
    super();
    if (!secret || typeof secret !== 'string' || secret.trim() === '') {
      throw new Error('JWT secret is required');
    }
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  /**
   * Signs a payload with the configured secret and expiration.
   * @param {Object} payload
   * @returns {string}
   */
  sign(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('payload is required and must be an object');
    }
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  /**
   * Verifies and decodes a JWT token.
   * @param {string} token
   * @returns {Object}
   */
  verify(token) {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('token is required');
    }
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
}

module.exports = JwtTokenService;
