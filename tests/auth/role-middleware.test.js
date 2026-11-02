'use strict';

const requireRole = require('../../infra/role-middleware');
const { ROLES } = require('../../services/auth/domain/Roles');

describe('requireRole middleware', () => {
  const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('should throw error when no roles are specified', () => {
    expect(() => requireRole()).toThrow('at least one role must be specified');
  });

  test('should call next() when user has the required role', () => {
    const middleware = requireRole(ROLES.ADMIN);
    const req = { user: { userId: 'u-admin', role: ROLES.ADMIN } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should call next() when user role is in the list of allowed roles', () => {
    const middleware = requireRole(ROLES.ADMIN, ROLES.COUNTER_AGENT);
    const reqAgent = { user: { userId: 'u-agent', role: ROLES.COUNTER_AGENT } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(reqAgent, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should support passing roles as an array', () => {
    const middleware = requireRole([ROLES.ADMIN, ROLES.COUNTER_AGENT]);
    const reqAdmin = { user: { userId: 'u-admin', role: ROLES.ADMIN } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(reqAdmin, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('should respond 403 when user role is not in allowed roles', () => {
    const middleware = requireRole(ROLES.ADMIN);
    const reqPassenger = { user: { userId: 'u-pass', role: ROLES.PASSENGER } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(reqPassenger, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond 401 when req.user is missing (auth middleware did not run)', () => {
    const middleware = requireRole(ROLES.PASSENGER);
    const req = {};
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond 401 when req.user.role is missing', () => {
    const middleware = requireRole(ROLES.PASSENGER);
    const req = { user: { userId: 'u-norole' } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'authentication required' });
    expect(next).not.toHaveBeenCalled();
  });
});
