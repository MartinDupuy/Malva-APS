'use strict';

const bcrypt = require('bcryptjs');
const User = require('../domain/User');
const { ROLES } = require('../domain/Roles');

const INITIAL_USERS = Object.freeze([
  {
    email: 'admin@malva.com',
    name: 'admin',
    password: '12345678',
    role: ROLES.ADMIN,
  },
]);

function createInitialUsers() {
  return INITIAL_USERS.map(({ email, name, password, role }) => new User({
    email,
    name,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
  }));
}

module.exports = { INITIAL_USERS, createInitialUsers };