'use strict';

class LoginUser {
  /**
   * @param {Object} userRepository
   * @param {Object} passwordHasher
   * @param {Object} tokenService
   */
  constructor(userRepository, passwordHasher, tokenService) {
    if (!userRepository) throw new Error('userRepository is required');
    if (!passwordHasher) throw new Error('passwordHasher is required');
    if (!tokenService) throw new Error('tokenService is required');
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  /**
   * @param {Object} input
   * @param {string} input.email
   * @param {string} input.password
   * @returns {Promise<{ token: string, user: Object }>}
   */
  async execute({ email, password } = {}) {
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('invalid credentials');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('invalid credentials');
    }

    const isPasswordValid = await this.passwordHasher.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('invalid credentials');
    }

    const token = this.tokenService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}

module.exports = LoginUser;
