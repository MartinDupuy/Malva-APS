'use strict';

const http = require('http');
const { createApp } = require('../../server');
const { ROLES } = require('../../services/auth/domain/Roles');

function request(port, method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    };

    const clientRequest = http.request({ port, method, path, headers: reqHeaders }, response => {
      let responseBody = '';
      response.on('data', chunk => { responseBody += chunk; });
      response.on('end', () => {
        let parsed = {};
        if (responseBody) {
          try {
            parsed = JSON.parse(responseBody);
          } catch {
            parsed = responseBody;
          }
        }
        resolve({ status: response.statusCode, body: parsed });
      });
    });

    clientRequest.on('error', reject);
    clientRequest.end(payload);
  });
}

function sampleFlight() {
  return {
    flightNumber: 'AR2000',
    originAirport: 'EZE',
    destinationAirport: 'MDZ',
    departureTime: '08:00',
    arrivalTime: '10:00',
    operatingDays: ['MON', 'TUE'],
    availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-12-31' },
    capacity: { economy: 100, firstClass: 10 },
    pricing: { economy: 50000, firstClass: 120000 },
  };
}

describe('Auth Integration and Route Protection Endpoints', () => {
  let server;
  let port;

  beforeEach(async () => {
    const app = createApp({ bookingRepository: 'memory', protectRoutes: true });
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    port = server.address().port;
  });

  afterEach(() => new Promise(resolve => server.close(resolve)));

  describe('POST /api/auth/register', () => {
    test('should register a new passenger user with 201 Created', async () => {
      const response = await request(port, 'POST', '/api/auth/register', {
        email: 'passenger@example.com',
        name: 'Carlos Passenger',
        password: 'securePassword123',
      });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('passenger@example.com');
      expect(response.body.user.name).toBe('Carlos Passenger');
      expect(response.body.user.role).toBe(ROLES.PASSENGER);
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('should return 409 Conflict when email is already registered', async () => {
      await request(port, 'POST', '/api/auth/register', {
        email: 'duplicate@example.com',
        name: 'Original User',
        password: 'password123',
      });

      const duplicateResponse = await request(port, 'POST', '/api/auth/register', {
        email: 'duplicate@example.com',
        name: 'Another User',
        password: 'password123',
      });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.error).toBe('email already registered');
    });

    test('should return 400 Bad Request when validation fails (e.g. short password, invalid email)', async () => {
      const shortPassRes = await request(port, 'POST', '/api/auth/register', {
        email: 'valid@example.com',
        name: 'User',
        password: '123',
      });
      expect(shortPassRes.status).toBe(400);

      const invalidEmailRes = await request(port, 'POST', '/api/auth/register', {
        email: 'not-an-email',
        name: 'User',
        password: 'password123',
      });
      expect(invalidEmailRes.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(port, 'POST', '/api/auth/register', {
        email: 'loginuser@example.com',
        name: 'Login User',
        password: 'correctPassword',
      });
    });

    test('should log in successfully with valid credentials returning 200 and JWT', async () => {
      const response = await request(port, 'POST', '/api/auth/login', {
        email: 'loginuser@example.com',
        password: 'correctPassword',
      });

      expect(response.status).toBe(200);
      expect(typeof response.body.token).toBe('string');
      expect(response.body.user.email).toBe('loginuser@example.com');
      expect(response.body.user.role).toBe(ROLES.PASSENGER);
    });

    test('should return 401 Unauthorized with invalid credentials on wrong password or missing user', async () => {
      const wrongPass = await request(port, 'POST', '/api/auth/login', {
        email: 'loginuser@example.com',
        password: 'wrongPassword',
      });
      expect(wrongPass.status).toBe(401);
      expect(wrongPass.body.error).toBe('invalid credentials');

      const wrongEmail = await request(port, 'POST', '/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'correctPassword',
      });
      expect(wrongEmail.status).toBe(401);
      expect(wrongEmail.body.error).toBe('invalid credentials');
    });
  });

  describe('Route protection based on roles and authentication', () => {
    let passengerToken;
    let adminToken;

    beforeEach(async () => {
      // Register Passenger
      await request(port, 'POST', '/api/auth/register', {
        email: 'passenger1@example.com',
        name: 'Pass One',
        password: 'password123',
        role: ROLES.PASSENGER,
      });
      const passLogin = await request(port, 'POST', '/api/auth/login', {
        email: 'passenger1@example.com',
        password: 'password123',
      });
      passengerToken = passLogin.body.token;

      // Register Admin
      await request(port, 'POST', '/api/auth/register', {
        email: 'admin1@example.com',
        name: 'Admin One',
        password: 'password123',
        role: ROLES.ADMIN,
      });
      const adminLogin = await request(port, 'POST', '/api/auth/login', {
        email: 'admin1@example.com',
        password: 'password123',
      });
      adminToken = adminLogin.body.token;
    });

    test('should allow public access to flight search without token', async () => {
      const response = await request(port, 'GET', '/api/flights/search');
      expect(response.status).toBe(200);
    });

    test('should reject flight creation (POST /api/flights) without token with 401', async () => {
      const response = await request(port, 'POST', '/api/flights', sampleFlight());
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('authentication required');
    });

    test('should reject flight creation with passenger token with 403 Forbidden', async () => {
      const response = await request(
        port,
        'POST',
        '/api/flights',
        sampleFlight(),
        { Authorization: `Bearer ${passengerToken}` }
      );

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('insufficient permissions');
    });

    test('should allow flight creation with admin token with 201 Created', async () => {
      const response = await request(
        port,
        'POST',
        '/api/flights',
        sampleFlight(),
        { Authorization: `Bearer ${adminToken}` }
      );

      expect(response.status).toBe(201);
      expect(response.body.flightNumber).toBe('AR2000');
    });

    test('should reject booking creation (POST /api/bookings) without token with 401', async () => {
      const response = await request(port, 'POST', '/api/bookings', {
        flightInstanceId: 'any-flight',
        passengers: [{ seatId: 'E1', name: 'Ana', email: 'ana@example.com' }],
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('authentication required');
    });

    test('should allow booking creation with valid passenger token', async () => {
      // First, create flight as admin
      const flightRes = await request(
        port,
        'POST',
        '/api/flights',
        sampleFlight(),
        { Authorization: `Bearer ${adminToken}` }
      );

      // Now create booking as passenger
      const bookingRes = await request(
        port,
        'POST',
        '/api/bookings',
        {
          flightInstanceId: flightRes.body.id,
          passengers: [{ seatId: 'E1', name: 'Pass One', email: 'passenger1@example.com' }],
        },
        { Authorization: `Bearer ${passengerToken}` }
      );

      expect(bookingRes.status).toBe(201);
      expect(bookingRes.body.status).toBe('HELD');
    });
  });
});
