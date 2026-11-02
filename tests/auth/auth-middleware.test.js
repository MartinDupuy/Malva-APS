'use strict';

const createAuthMiddleware = require('../../infra/auth-middleware');
const JwtTokenService = require('../../services/auth/adapters/JwtTokenService');
const { ROLES } = require('../../services/auth/domain/Roles');

describe('createAuthMiddleware', () => {
  const secret = 'auth-middleware-test-secret';
  let tokenService;
  let authMiddleware;

  beforeEach(() => {
    tokenService = new JwtTokenService({ secret, expiresIn: '1h' });
    authMiddleware = createAuthMiddleware(tokenService);
  });

  const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('should throw error when tokenService is missing', () => {
    expect(() => createAuthMiddleware()).toThrow('tokenService is required');
  });

  test('should call next() and attach req.user when valid Bearer token is provided', () => {
    const token = tokenService.sign({ userId: 'usr-1', email: 'john@example.com', role: ROLES.PASSENGER });
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({
      userId: 'usr-1',
      email: 'john@example.com',
      role: ROLES.PASSENGER,
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should support capitalized Authorization header', () => {
    const token = tokenService.sign({ userId: 'usr-2', email: 'admin@example.com', role: ROLES.ADMIN });
    const req = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.userId).toBe('usr-2');
  });

  test('should respond 401 when Authorization header is missing', () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond 401 when Authorization header does not use Bearer scheme', () => {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond 401 when token after Bearer is empty', () => {
    const req = { headers: { authorization: 'Bearer   ' } };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond 401 when token is invalid or tampered', () => {
    const req = { headers: { authorization: 'Bearer invalid.tampered.token' } };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond 401 when token is expired', () => {
    const expiredService = new JwtTokenService({ secret, expiresIn: '0s' });
    const expiredToken = expiredService.sign({ userId: 'usr-exp', role: ROLES.PASSENGER });

    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'authentication required' });
    expect(next).not.toHaveBeenCalled();
  });
});
