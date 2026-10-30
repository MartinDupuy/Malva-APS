'use strict';

const User = require('../domain/User');

const MIN_PASSWORD_LENGTH = 6;

class RegisterUser {
  /**
   * @param {Object} userRepository
   * @param {Object} passwordHasher
   */
  constructor(userRepository, passwordHasher) {
    if (!userRepository) throw new Error('userRepository is required');
    if (!passwordHasher) throw new Error('passwordHasher is required');
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  /**
   * @param {Object} input
   * @param {string} input.email
   * @param {string} input.name
   * @param {string} input.password
   * @param {string} [input.role]
   * @returns {Promise<Object>}
   */
  async execute({ email, name, password, role } = {}) {
    this._validatePassword(password);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('email already registered');
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const user = new User({ email, name, passwordHash, role });
    await this.userRepository.create(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  _validatePassword(password) {
    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }
  }
}

module.exports = RegisterUser;
