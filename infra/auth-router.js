'use strict';

const express = require('express');

function createAuthRouter(controller) {
  const router = express.Router();
  router.post('/register', controller.register.bind(controller));
  router.post('/login', controller.login.bind(controller));
  return router;
}

module.exports = createAuthRouter;
