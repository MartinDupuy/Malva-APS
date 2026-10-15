const express = require('express');
const InMemoryFlightRepository = require('./services/flights/adapters/in-memory-flight-repository');
const FlightController = require('./services/flights/adapters/flight-controller');
const createFlightRouter = require('./infra/flight-router');
const createBookingRouter = require('./infra/booking-router');
const BookingController = require('./services/bookings/adapters/booking-controller');
const InMemoryBookingRepository = require('./services/bookings/adapters/in-memory-booking-repository');
const SeatFactory = require('./services/bookings/adapters/seat-factory');
const GetAvailability = require('./services/bookings/use-cases/get-availability');
const CreateBooking = require('./services/bookings/use-cases/create-booking');
const ConfirmBooking = require('./services/bookings/use-cases/confirm-booking');
const { InMemorySeatHoldRepository } = require('./services/seats/adapters/in-memory-seat-hold-repository');
const PostgresSeatHoldRepository = require('./services/seats/adapters/postgres-seat-hold-repository');
const PostgresBookingRepository = require('./services/bookings/adapters/postgres-booking-repository');

function createApp() {
  const app = express();
  const flightRepository = createFlightRepository(process.env.FLIGHT_REPOSITORY || 'memory');
  const flightController = new FlightController(flightRepository);
  const seatsByFlightInstance = new Map();
  const seatFactory = new SeatFactory(seatsByFlightInstance);
  const usePostgres = process.env.BOOKING_REPOSITORY === 'postgres';
  const seatHoldRepository = usePostgres
    ? new PostgresSeatHoldRepository({ seatsByFlightInstance })
    : new InMemorySeatHoldRepository({ seatsByFlightInstance });
  const bookingRepository = usePostgres ? new PostgresBookingRepository() : new InMemoryBookingRepository();
  const bookingController = new BookingController({
    flightRepository,
    seatFactory,
    getAvailability: new GetAvailability(flightRepository, seatHoldRepository, seatFactory),
    createBooking: new CreateBooking(bookingRepository, seatHoldRepository),
    confirmBooking: new ConfirmBooking(bookingRepository, seatHoldRepository),
    bookingRepository
  });

  app.use(express.json({ limit: '1mb' }));
  app.use('/api/flights', createFlightRouter(flightController));
  app.use('/api', createBookingRouter(bookingController));
  app.use(handleApiError);
  return app;
}

function createServer() {
  return createApp();
}

function handleApiError(error, request, response, next) {
  if (response.headersSent) return next(error);
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body is too large' });
  }
  if (error instanceof SyntaxError && error.status === 400 && error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Request body must be valid JSON' });
  }
  return response.status(500).json({ error: error.message });
}

function createFlightRepository(repositoryType) {
  if (repositoryType === 'memory') return new InMemoryFlightRepository();
  throw new Error(`Unsupported flight repository: ${repositoryType}`);
}

const server = createServer();
const port = Number(process.env.PORT) || 3000;

if (require.main === module) {
  server.listen(port, () => console.log(`Flight API listening on port ${port}`));
}

module.exports = { createApp, createServer, server };
