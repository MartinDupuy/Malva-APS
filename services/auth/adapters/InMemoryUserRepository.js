'use strict';

class InMemoryUserRepository {
  /**
   * @param {Array<import('../domain/User')>} [initialUsers=[]]
   */
  constructor(initialUsers = []) {
    this.users = new Map();
    for (const user of initialUsers) {
      this.users.set(user.id, user);
    }
  }

  /**
   * @param {import('../domain/User')} user
   * @returns {Promise<import('../domain/User')>}
   */
  async create(user) {
    this.users.set(user.id, user);
    return user;
  }

  /**
   * @param {string} id
   * @returns {Promise<import('../domain/User')|null>}
   */
  async findById(id) {
    if (!id || typeof id !== 'string') return null;
    return this.users.get(id) || null;
  }

  /**
   * @param {string} email
   * @returns {Promise<import('../domain/User')|null>}
   */
  async findByEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return null;
  }
}

module.exports = InMemoryUserRepository;
