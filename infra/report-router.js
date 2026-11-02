const express = require('express');

function createReportRouter(controller, { authMiddleware, roleMiddleware } = {}) {
  const router = express.Router();
  const adminOnly = (authMiddleware && roleMiddleware) ? [authMiddleware, roleMiddleware] : [];

  router.get('/occupancy', ...adminOnly, controller.json.bind(controller));
  router.get('/occupancy.pdf', ...adminOnly, controller.pdf.bind(controller));
  return router;
}

module.exports = createReportRouter;