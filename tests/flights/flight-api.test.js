const http = require('http');
const { createApp } = require('../../server');

function request(port, method, path, body, raw = false) {
  return new Promise((resolve, reject) => {
    const clientRequest = http.request({ port, method, path, headers: body ? { 'Content-Type': 'application/json' } : {} }, response => {
      let responseBody = '';
      response.on('data', chunk => { responseBody += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: responseBody ? JSON.parse(responseBody) : {} }));
    });
    clientRequest.on('error', reject);
    clientRequest.end(raw ? body : body ? JSON.stringify(body) : '');
  });
}

function validFlight() {
  return {
    flightNumber: 'AR1234', originAirport: 'EZE', destinationAirport: 'COR',
    departureTime: '10:00', arrivalTime: '22:00', operatingDays: ['MON', 'WED', 'FRI'],
    availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-12-31' },
    capacity: { economy: 180, firstClass: 12 },
    pricing: { economy: 85000.50, firstClass: 180000.00 }
  };
}

describe('Flight REST API with Express', () => {
  let app;
  let server;
  let port;

  beforeEach(async () => {
    app = createApp();
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    port = server.address().port;
  });

  afterEach(() => new Promise(resolve => server.close(resolve)));

  test('creates, updates and cancels a flight', async () => {
    const created = await request(port, 'POST', '/api/flights', validFlight());
    const updated = await request(port, 'PUT', `/api/flights/${created.body.id}`, { departureTime: '11:00' });
    const cancelled = await request(port, 'DELETE', `/api/flights/${created.body.id}`);

    expect(created.status).toBe(201);
    expect(updated.status).toBe(200);
    expect(updated.body.departureTime).toBe('11:00');
    expect(cancelled.body.status).toBe('CANCELLED');
  });

  test('lists flights immediately after creation', async () => {
    await request(port, 'POST', '/api/flights', validFlight());

    const response = await request(port, 'GET', '/api/flights');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  test('searches active flights by route, passengers and tariff', async () => {
    await request(port, 'POST', '/api/flights', validFlight());
    await request(port, 'POST', '/api/flights', {
      ...validFlight(), flightNumber: 'AR5678', capacity: { economy: 2, firstClass: 4 }
    });

    const response = await request(port, 'GET', '/api/flights/search?origin=EZE&destination=COR&passengers=10&tariff=90000');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].flightNumber).toBe('AR1234');
  });

  test('searches availability by first class capacity', async () => {
    await request(port, 'POST', '/api/flights', validFlight());
    await request(port, 'POST', '/api/flights', {
      ...validFlight(), flightNumber: 'AR5678', capacity: { economy: 180, firstClass: 2 }
    });

    const response = await request(port, 'GET', '/api/flights/search?cabinClass=firstClass&passengers=5');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].flightNumber).toBe('AR1234');
  });

  test('rejects dates that do not exist in the calendar', async () => {
    const response = await request(port, 'GET', '/api/flights/search?date=2099-02-31');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('date must be a real calendar date');
  });

  test('search excludes cancelled flights and unavailable dates', async () => {
    const created = await request(port, 'POST', '/api/flights', validFlight());
    await request(port, 'DELETE', `/api/flights/${created.body.id}`);

    const response = await request(port, 'GET', '/api/flights/search?date=2100-01-01');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('returns bad request for malformed JSON', async () => {
    const response = await request(port, 'POST', '/api/flights', '{invalid', true);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Request body must be valid JSON');
  });

  test('returns payload too large for oversized JSON', async () => {
    const response = await request(port, 'POST', '/api/flights', 'x'.repeat(1024 * 1024 + 1), true);

    expect(response.status).toBe(413);
    expect(response.body.error).toBe('Request body is too large');
  });

  test('returns bad request for invalid operating days', async () => {
    const response = await request(port, 'POST', '/api/flights', { ...validFlight(), operatingDays: ['INVALID'] });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/no es un formato válido/);
  });
});
