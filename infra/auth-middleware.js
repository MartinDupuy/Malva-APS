'use strict';

/**
 * Creates an Express authentication middleware that validates JWT tokens.
 * @param {import('../services/auth/domain/TokenService')} tokenService
 * @returns {import('express').RequestHandler}
 */
function createAuthMiddleware(tokenService) {
  if (!tokenService) {
    throw new Error('tokenService is required');
  }

  return (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'authentication required' });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'authentication required' });
    }

    try {
      const payload = tokenService.verify(token);
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch {
      return res.status(401).json({ error: 'authentication required' });
    }
  };
}

module.exports = createAuthMiddleware;
