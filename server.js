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
const InMemoryUserRepository = require('./services/auth/adapters/InMemoryUserRepository');
const BcryptPasswordHasher = require('./services/auth/adapters/BcryptPasswordHasher');
const JwtTokenService = require('./services/auth/adapters/JwtTokenService');
const RegisterUser = require('./services/auth/use-cases/RegisterUser');
const LoginUser = require('./services/auth/use-cases/LoginUser');
const AuthController = require('./services/auth/adapters/AuthController');
const createAuthRouter = require('./infra/auth-router');
const createAuthMiddleware = require('./infra/auth-middleware');
const requireRole = require('./infra/role-middleware');
const { ROLES } = require('./services/auth/domain/Roles');
const SmtpEmailSender = require('./services/notifications/adapters/SmtpEmailSender');
const NotifyFlightChange = require('./services/notifications/use-cases/notify-flight-change');

function createApp({
  bookingRepository: bookingRepositoryType = process.env.BOOKING_REPOSITORY || 'postgres',
  userRepository = new InMemoryUserRepository(),
  passwordHasher = new BcryptPasswordHasher(),
  tokenService = new JwtTokenService(),
  protectRoutes = false,
  emailSender: customEmailSender = null,
  notifyFlightChange: customNotifyFlightChange = null,
} = {}) {
  const app = express();
  const flightRepository = createFlightRepository(process.env.FLIGHT_REPOSITORY || 'memory');
  const seatsByFlightInstance = new Map();
  const seatFactory = new SeatFactory(seatsByFlightInstance);
  const usePostgres = bookingRepositoryType === 'postgres';
  const seatHoldRepository = usePostgres
    ? new PostgresSeatHoldRepository({ seatsByFlightInstance })
    : new InMemorySeatHoldRepository({ seatsByFlightInstance });
  const bookingRepository = usePostgres ? new PostgresBookingRepository() : new InMemoryBookingRepository();

  const emailSender = customEmailSender || (process.env.SMTP_HOST ? new SmtpEmailSender() : null);
  const notifyFlightChange = customNotifyFlightChange || (
    emailSender ? new NotifyFlightChange({ bookingRepository, emailSender }) : null
  );

  const getAvailability = new GetAvailability(flightRepository, seatHoldRepository, seatFactory);
  const flightController = new FlightController(flightRepository, { notifyFlightChange, getAvailability });
  const bookingController = new BookingController({
    flightRepository,
    seatFactory,
    getAvailability,
    createBooking: new CreateBooking(bookingRepository, seatHoldRepository),
    confirmBooking: new ConfirmBooking(bookingRepository, seatHoldRepository),
    bookingRepository
  });

  const registerUser = new RegisterUser(userRepository, passwordHasher);
  const loginUser = new LoginUser(userRepository, passwordHasher, tokenService);
  const authController = new AuthController({ registerUser, loginUser });
  const authMiddleware = createAuthMiddleware(tokenService);
  const adminOnlyMiddleware = requireRole(ROLES.ADMIN);

  app.use(express.json({ limit: '1mb' }));
  app.get('/', (req, res) => {
    res.json({
      name: 'Malva Airlines API',
      status: 'online',
      frontend: 'http://localhost:5173',
      endpoints: {
        auth: '/api/auth',
        flights: '/api/flights',
        bookings: '/api'
      }
    });
  });
  app.use('/api/auth', createAuthRouter(authController));
  app.use('/api/flights', createFlightRouter(flightController, protectRoutes ? { authMiddleware, roleMiddleware: adminOnlyMiddleware } : {}));
  app.use('/api', createBookingRouter(bookingController, protectRoutes ? { authMiddleware } : {}));
  app.use(handleApiError);
  return app;
}

function createServer() {
  return createApp({ protectRoutes: true });
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

const port = Number(process.env.PORT) || 3000;
const server = require.main === module ? createServer() : null;

if (require.main === module) {
  server.listen(port, () => console.log(`Flight API listening on port ${port}`));
}

module.exports = { createApp, createServer, server };
