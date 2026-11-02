'use strict';

/**
 * Creates an Express authorization middleware that checks if the authenticated user has one of the allowed roles.
 * @param {...(string|string[])} allowedRoles
 * @returns {import('express').RequestHandler}
 */
function requireRole(...allowedRoles) {
  const roles = allowedRoles.flat();
  if (roles.length === 0) {
    throw new Error('at least one role must be specified');
  }

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'insufficient permissions' });
    }

    next();
  };
}

module.exports = requireRole;
