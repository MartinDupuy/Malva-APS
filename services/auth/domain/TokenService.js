'use strict';

/**
 * TokenService Interface (Port)
 *
 * In JS we don't have strict interfaces, so we define a class with methods that throw.
 * Adapters must implement this port.
 */
class TokenService {
  /**
   * Signs a payload and returns a token string.
   * @param {Object} payload
   * @returns {string}
   */
  sign(payload) {
    throw new Error('Method not implemented.');
  }

  /**
   * Verifies a token and returns the decoded payload.
   * @param {string} token
   * @returns {Object}
   */
  verify(token) {
    throw new Error('Method not implemented.');
  }
}

module.exports = TokenService;
