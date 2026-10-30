const express = require('express');

function createBookingRouter(controller, { authMiddleware } = {}) {
  const router = express.Router();
  const requireAuth = authMiddleware ? [authMiddleware] : [];

  router.get('/flights/:flightInstanceId/availability', controller.availability.bind(controller));
  router.post('/bookings', ...requireAuth, controller.create.bind(controller));
  router.get('/bookings/:bookingId', controller.get.bind(controller));
  router.post('/bookings/:bookingId/confirm', ...requireAuth, controller.confirm.bind(controller));
  return router;
}

module.exports = createBookingRouter;