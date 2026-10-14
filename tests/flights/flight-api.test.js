const http = require('http');
const { createServer } = require('../../server');

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

function validFlight() {
  return {
    flightNumber: 'AR123', origin: 'EZE', destination: 'MAD',
    departureTime: '10:00', arrivalTime: '22:00', operatingDays: [1, 3, 5],
    startDate: '2026-01-01', endDate: '2026-12-31',
    capacity: { economy: 180, first: 12 }
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
      operatingDays: [8]
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Operating days/);
  });
});
