const express = require('express');

function createBookingRouter(controller, { authMiddleware, staffMiddleware } = {}) {
  const router = express.Router();
  const requireAuth = authMiddleware ? [authMiddleware] : [];
  const requireStaff = staffMiddleware ? [authMiddleware, staffMiddleware] : [];

  router.get('/flights/:flightInstanceId/availability', controller.availability.bind(controller));
  router.post('/bookings', ...requireAuth, controller.create.bind(controller));
  router.get('/bookings/search', ...requireStaff, controller.search.bind(controller));
  router.get('/bookings/:bookingId', ...requireStaff, controller.get.bind(controller));
  router.post('/bookings/:bookingId/confirm', ...requireAuth, controller.confirm.bind(controller));
  return router;
}

module.exports = createBookingRouter;
