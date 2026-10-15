const express = require('express');

function createBookingRouter(controller) {
  const router = express.Router();
  router.get('/flights/:flightInstanceId/availability', controller.availability.bind(controller));
  router.post('/bookings', controller.create.bind(controller));
  router.get('/bookings/:bookingId', controller.get.bind(controller));
  router.post('/bookings/:bookingId/confirm', controller.confirm.bind(controller));
  return router;
}

module.exports = createBookingRouter;