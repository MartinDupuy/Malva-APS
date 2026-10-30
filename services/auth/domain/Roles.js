'use strict';

const ROLES = Object.freeze({
  PASSENGER: 'PASSENGER',
  ADMIN: 'ADMIN',
  COUNTER_AGENT: 'COUNTER_AGENT',
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

function isValidRole(role) {
  return typeof role === 'string' && ALL_ROLES.includes(role);
}

module.exports = {
  ROLES,
  ALL_ROLES,
  isValidRole,
};
