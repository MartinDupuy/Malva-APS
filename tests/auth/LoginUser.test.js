'use strict';

const LoginUser = require('../../services/auth/use-cases/LoginUser');
const InMemoryUserRepository = require('../../services/auth/adapters/InMemoryUserRepository');
const BcryptPasswordHasher = require('../../services/auth/adapters/BcryptPasswordHasher');
const JwtTokenService = require('../../services/auth/adapters/JwtTokenService');
const User = require('../../services/auth/domain/User');
const { ROLES } = require('../../services/auth/domain/Roles');

describe('LoginUser use case', () => {
  let userRepository;
  let passwordHasher;
  let tokenService;
  let loginUser;

  const userPassword = 'secretPassword123';
  let registeredUser;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new BcryptPasswordHasher({ saltRounds: 4 });
    tokenService = new JwtTokenService({ secret: 'login-test-jwt-secret' });
    loginUser = new LoginUser(userRepository, passwordHasher, tokenService);

    const hash = await passwordHasher.hash(userPassword);
    registeredUser = new User({
      id: 'usr-123',
      email: 'john@example.com',
      passwordHash: hash,
      name: 'John Doe',
      role: ROLES.PASSENGER,
    });
    await userRepository.create(registeredUser);
  });

  describe('Constructor validations', () => {
    test('should throw error when userRepository is missing', () => {
      expect(() => new LoginUser(null, passwordHasher, tokenService)).toThrow('userRepository is required');
    });

    test('should throw error when passwordHasher is missing', () => {
      expect(() => new LoginUser(userRepository, null, tokenService)).toThrow('passwordHasher is required');
    });

    test('should throw error when tokenService is missing', () => {
      expect(() => new LoginUser(userRepository, passwordHasher, null)).toThrow('tokenService is required');
    });
  });

  describe('execute()', () => {
    test('should log in successfully with valid credentials and return token and user profile', async () => {
      const result = await loginUser.execute({
        email: 'john@example.com',
        password: userPassword,
      });

      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.user).toEqual({
        id: 'usr-123',
        email: 'john@example.com',
        name: 'John Doe',
        role: ROLES.PASSENGER,
      });
      expect(result.user).not.toHaveProperty('passwordHash');

      const payload = tokenService.verify(result.token);
      expect(payload.userId).toBe('usr-123');
      expect(payload.email).toBe('john@example.com');
      expect(payload.role).toBe(ROLES.PASSENGER);
    });

    test('should include correct role in token and user response for ADMIN and COUNTER_AGENT', async () => {
      const adminHash = await passwordHasher.hash('adminPass123');
      const adminUser = new User({
        id: 'admin-1',
        email: 'admin@malva.com',
        passwordHash: adminHash,
        name: 'Admin User',
        role: ROLES.ADMIN,
      });
      await userRepository.create(adminUser);

      const agentHash = await passwordHasher.hash('agentPass123');
      const agentUser = new User({
        id: 'agent-1',
        email: 'agent@malva.com',
        passwordHash: agentHash,
        name: 'Counter Agent',
        role: ROLES.COUNTER_AGENT,
      });
      await userRepository.create(agentUser);

      const adminResult = await loginUser.execute({ email: 'admin@malva.com', password: 'adminPass123' });
      expect(adminResult.user.role).toBe(ROLES.ADMIN);
      expect(tokenService.verify(adminResult.token).role).toBe(ROLES.ADMIN);

      const agentResult = await loginUser.execute({ email: 'agent@malva.com', password: 'agentPass123' });
      expect(agentResult.user.role).toBe(ROLES.COUNTER_AGENT);
      expect(tokenService.verify(agentResult.token).role).toBe(ROLES.COUNTER_AGENT);
    });

    test('should fail with "invalid credentials" when email does not exist', async () => {
      await expect(loginUser.execute({ email: 'unknown@example.com', password: userPassword }))
        .rejects.toThrow('invalid credentials');
    });

    test('should fail with "invalid credentials" when password is incorrect', async () => {
      await expect(loginUser.execute({ email: 'john@example.com', password: 'wrongPassword' }))
        .rejects.toThrow('invalid credentials');
    });

    test('should fail with "invalid credentials" when inputs are missing or invalid types', async () => {
      await expect(loginUser.execute()).rejects.toThrow('invalid credentials');
      await expect(loginUser.execute({ email: '', password: userPassword })).rejects.toThrow('invalid credentials');
      await expect(loginUser.execute({ email: 'john@example.com', password: '' })).rejects.toThrow('invalid credentials');
      await expect(loginUser.execute({ email: null, password: userPassword })).rejects.toThrow('invalid credentials');
      await expect(loginUser.execute({ email: 'john@example.com', password: null })).rejects.toThrow('invalid credentials');
    });
  });
});
