const express = require('express');

function createFlightRouter(controller, { authMiddleware, roleMiddleware } = {}) {
  const router = express.Router();
  const adminOnly = (authMiddleware && roleMiddleware) ? [authMiddleware, roleMiddleware] : [];

  router.post('/', ...adminOnly, controller.create.bind(controller));
  router.get('/search', controller.search.bind(controller));
  router.get('/', controller.list.bind(controller));
  router.put('/:id', ...adminOnly, controller.update.bind(controller));
  router.delete('/:id', ...adminOnly, controller.cancel.bind(controller));
  return router;
}

module.exports = createFlightRouter;
