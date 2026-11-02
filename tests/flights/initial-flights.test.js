'use strict';

const { createInitialFlights } = require('../../services/flights/seeds/initial-flights');
const { createApp } = require('../../server');

describe('initial flights seed', () => {
  test('creates a valid list of initial flights with active status and valid routes', () => {
    const flights = createInitialFlights();
    expect(flights.length).toBeGreaterThanOrEqual(4);

    for (const flight of flights) {
      expect(flight.status).toBe('ACTIVE');
      expect(flight.flightNumber).toMatch(/^AR\d{4}$/);
      expect(flight.originAirport).toBeDefined();
      expect(flight.destinationAirport).toBeDefined();
      expect(flight.originAirport).not.toBe(flight.destinationAirport);
      expect(flight.capacity.economy).toBeGreaterThan(0);
      expect(flight.pricing.economy.amount).toBeGreaterThan(0);
    }
  });

  test('seeds flights into the repository when seedFlights is true', async () => {
    const app = createApp({ bookingRepository: 'memory', seedFlights: true });
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/flights`);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.length).toBeGreaterThanOrEqual(4);

      const flightNumbers = body.map((f) => f.flightNumber);
      expect(flightNumbers).toContain('AR1234');
      expect(flightNumbers).toContain('AR1400');
      expect(flightNumbers).toContain('AR1500');
      expect(flightNumbers).toContain('AR1600');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
