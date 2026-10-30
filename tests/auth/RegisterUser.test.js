'use strict';

const RegisterUser = require('../../services/auth/use-cases/RegisterUser');
const InMemoryUserRepository = require('../../services/auth/adapters/InMemoryUserRepository');
const BcryptPasswordHasher = require('../../services/auth/adapters/BcryptPasswordHasher');
const { ROLES } = require('../../services/auth/domain/Roles');

describe('RegisterUser use case', () => {
  let userRepository;
  let passwordHasher;
  let registerUser;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new BcryptPasswordHasher({ saltRounds: 4 });
    registerUser = new RegisterUser(userRepository, passwordHasher);
  });

  describe('Constructor validations', () => {
    test('should throw error when userRepository is missing', () => {
      expect(() => new RegisterUser(null, passwordHasher)).toThrow('userRepository is required');
    });

    test('should throw error when passwordHasher is missing', () => {
      expect(() => new RegisterUser(userRepository, null)).toThrow('passwordHasher is required');
    });
  });

  describe('execute()', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      name: 'Maria Rossi',
      password: 'mypassword123',
    };

    test('should register a new user successfully and persist in repository', async () => {
      const result = await registerUser.execute(validRegistrationData);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe('newuser@example.com');
      expect(result.name).toBe('Maria Rossi');
      expect(result.role).toBe(ROLES.PASSENGER);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result).not.toHaveProperty('passwordHash');

      const savedUser = await userRepository.findById(result.id);
      expect(savedUser).not.toBeNull();
      expect(savedUser.email).toBe('newuser@example.com');
      expect(savedUser.passwordHash).not.toBe('mypassword123');
      expect(savedUser.passwordHash.startsWith('$2')).toBe(true);
    });

    test('should allow specifying ADMIN or COUNTER_AGENT role', async () => {
      const admin = await registerUser.execute({
        ...validRegistrationData,
        email: 'admin@example.com',
        role: ROLES.ADMIN,
      });

      const agent = await registerUser.execute({
        ...validRegistrationData,
        email: 'agent@example.com',
        role: ROLES.COUNTER_AGENT,
      });

      expect(admin.role).toBe(ROLES.ADMIN);
      expect(agent.role).toBe(ROLES.COUNTER_AGENT);
    });

    test('should throw error when email is already registered', async () => {
      await registerUser.execute(validRegistrationData);

      await expect(registerUser.execute(validRegistrationData)).rejects.toThrow('email already registered');
    });

    test('should throw error when password is shorter than 6 characters or missing', async () => {
      await expect(registerUser.execute({ ...validRegistrationData, password: '' }))
        .rejects.toThrow('password must be at least 6 characters long');

      await expect(registerUser.execute({ ...validRegistrationData, password: '123' }))
        .rejects.toThrow('password must be at least 6 characters long');

      await expect(registerUser.execute({ ...validRegistrationData, password: null }))
        .rejects.toThrow('password must be at least 6 characters long');
    });

    test('should throw error when email is invalid', async () => {
      await expect(registerUser.execute({ ...validRegistrationData, email: 'bad-email' }))
        .rejects.toThrow('email must be a valid email address');
    });

    test('should throw error when name is missing or empty', async () => {
      await expect(registerUser.execute({ ...validRegistrationData, name: '' }))
        .rejects.toThrow('name is required');
    });
  });
});
