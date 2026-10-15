const http = require('http');
const { createApp } = require('../../server');

function request(port, method, path, body) {
  return new Promise((resolve, reject) => {
    const clientRequest = http.request({
      port,
      method,
      path,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    }, response => {
      let responseBody = '';
      response.on('data', chunk => { responseBody += chunk; });
      response.on('end', () => resolve({
        status: response.statusCode,
        body: responseBody ? JSON.parse(responseBody) : {}
      }));
    });
    clientRequest.on('error', reject);
    clientRequest.end(body ? JSON.stringify(body) : '');
  });
}

describe('Booking REST API', () => {
  let server;
  let port;

  beforeEach(async () => {
    server = createApp({ bookingRepository: 'memory' }).listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    port = server.address().port;
  });

  afterEach(() => new Promise(resolve => server.close(resolve)));

  test('returns availability, creates a hold and confirms a booking', async () => {
    const flight = await request(port, 'POST', '/api/flights', {
      flightNumber: 'AR9999', originAirport: 'EZE', destinationAirport: 'COR',
      departureTime: '10:00', arrivalTime: '12:00', operatingDays: ['MON'],
      availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-12-31' },
      capacity: { economy: 2, firstClass: 1 }, pricing: { economy: 10000, firstClass: 20000 }
    });
    const availability = await request(port, 'GET', `/api/flights/${flight.body.id}/availability`);

    expect(availability.status).toBe(200);
    expect(availability.body).toHaveLength(3);
    expect(availability.body[0].status).toBe('AVAILABLE');

    const booking = await request(port, 'POST', '/api/bookings', {
      flightInstanceId: flight.body.id,
      passengers: [{ seatId: 'E1', name: 'Ana Perez', email: 'ana@example.com' }]
    });

    expect(booking.status).toBe(201);
    expect(booking.body.status).toBe('HELD');

    const conflict = await request(port, 'POST', '/api/bookings', {
      flightInstanceId: flight.body.id,
      passengers: [{ seatId: 'E1', name: 'Luis Gomez', email: 'luis@example.com' }]
    });
    expect(conflict.status).toBe(409);

    const confirmed = await request(port, 'POST', `/api/bookings/${booking.body.id}/confirm`);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.status).toBe('CONFIRMED');
  });

  test('rejects the tenth passenger at the API boundary', async () => {
    const response = await request(port, 'POST', '/api/bookings', {
      flightInstanceId: 'missing-flight',
      passengers: Array.from({ length: 10 }, (_, index) => ({
        seatId: `E${index + 1}`, name: `Passenger ${index}`, email: `p${index}@example.com`
      }))
    });

    expect(response.status).toBe(404);
  });
});