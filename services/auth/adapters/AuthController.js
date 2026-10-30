'use strict';

class AuthController {
  /**
   * @param {Object} dependencies
   * @param {import('../use-cases/RegisterUser')} dependencies.registerUser
   * @param {import('../use-cases/LoginUser')} dependencies.loginUser
   */
  constructor({ registerUser, loginUser } = {}) {
    if (!registerUser) throw new Error('registerUser is required');
    if (!loginUser) throw new Error('loginUser is required');
    this.registerUser = registerUser;
    this.loginUser = loginUser;
  }

  /**
   * Handles user registration HTTP request.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async register(req, res) {
    try {
      const user = await this.registerUser.execute(req.body || {});
      return res.status(201).json({ user });
    } catch (error) {
      if (error.message === 'email already registered') {
        return res.status(409).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Handles user login HTTP request.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async login(req, res) {
    try {
      const result = await this.loginUser.execute(req.body || {});
      return res.status(200).json(result);
    } catch (error) {
      if (error.message === 'invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
