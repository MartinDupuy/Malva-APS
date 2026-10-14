const http = require('http');
const { createServer } = require('../../server');
const { createRouter } = require('../../infra/http-router');

function sendRequest(port, method, path, body) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      port,
      method,
      path,
      headers: { 'Content-Type': 'application/json' }
    }, response => {
      let responseBody = '';
      response.on('data', chunk => { responseBody += chunk; });
      response.on('end', () => resolve({
        status: response.statusCode,
        body: JSON.parse(responseBody)
      }));
    });
    request.on('error', reject);
    request.end(body ? JSON.stringify(body) : '');
  });
}

function sendRawRequest(port, method, path, body) {
  return new Promise((resolve, reject) => {
    const request = http.request({ port, method, path }, response => {
      let responseBody = '';
      response.on('data', chunk => { responseBody += chunk; });
      response.on('end', () => resolve({
        status: response.statusCode,
        body: JSON.parse(responseBody)
      }));
    });
    request.on('error', reject);
    request.end(body);
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

describe('Flight REST API', () => {
  let server;
  let port;

  beforeEach(async () => {
    server = createServer();
    await new Promise(resolve => server.listen(0, resolve));
    port = server.address().port;
  });

  afterEach(() => new Promise(resolve => server.close(resolve)));

  test('creates, updates and cancels a flight', async () => {
    const created = await sendRequest(port, 'POST', '/api/flights', validFlight());
    const updated = await sendRequest(port, 'PUT', `/api/flights/${created.body.id}`, {
      departureTime: '11:00'
    });
    const cancelled = await sendRequest(port, 'DELETE', `/api/flights/${created.body.id}`);

    expect(created.status).toBe(201);
    expect(updated.status).toBe(200);
    expect(updated.body.departureTime).toBe('11:00');
    expect(cancelled.body.status).toBe('CANCELLED');
  });

  test('returns bad request for invalid operating days', async () => {
    const response = await sendRequest(port, 'POST', '/api/flights', {
      ...validFlight(),
      operatingDays: ['INVALID']
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/no es un formato válido/);
  });

  test.each([
    ['invalid date range', { availabilityPeriod: { startDate: '2099-06-01', endDate: '2099-01-01' } }, /fecha de fin/],
    ['invalid economy capacity', { capacity: { economy: -1, firstClass: 12 } }, /capacidad de Economy/],
    ['invalid first class price', { pricing: { economy: 85000, firstClass: -1 } }, /firstClass price/]
  ])('returns bad request for %s', async (name, changes, errorPattern) => {
    const response = await sendRequest(port, 'POST', '/api/flights', {
      ...validFlight(),
      ...changes
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(errorPattern);
  });

  test('returns bad request for malformed JSON', async () => {
    const response = await sendRawRequest(port, 'POST', '/api/flights', '{invalid');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Request body must be valid JSON');
  });

  test('returns payload too large for oversized JSON', async () => {
    const response = await sendRawRequest(port, 'POST', '/api/flights', 'x'.repeat(1024 * 1024 + 1));

    expect(response.status).toBe(413);
    expect(response.body.error).toBe('Request body is too large');
  });

  test('does not parse a body for GET requests', async () => {
    const response = await sendRawRequest(port, 'GET', '/api/flights', '');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('accepts routes supplied from outside the router', async () => {
    const handler = jest.fn((request, response) => {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ paymentId: request.params.id }));
    });
    const customServer = require('http').createServer(createRouter([
      { method: 'GET', path: '/api/payments/:id', handler }
    ]));
    await new Promise(resolve => customServer.listen(0, resolve));
    const customPort = customServer.address().port;
    const response = await sendRawRequest(customPort, 'GET', '/api/payments/pay-1', '');
    await new Promise(resolve => customServer.close(resolve));

    expect(response.status).toBe(200);
    expect(response.body.paymentId).toBe('pay-1');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
