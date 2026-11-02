const http = require('http');
const { createApp } = require('../../server');
const JwtTokenService = require('../../services/auth/adapters/JwtTokenService');
const { ROLES } = require('../../services/auth/domain/Roles');

function request(port, path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const clientRequest = http.request({ port, path, headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks)
      }));
    });
    clientRequest.on('error', reject);
    clientRequest.end();
  });
}

describe('Occupancy report API', () => {
  const tokenService = new JwtTokenService({ secret: 'report-test-secret' });
  let server;
  let port;

  beforeEach(async () => {
    server = createApp({
      bookingRepository: 'memory',
      protectRoutes: true,
      tokenService
    }).listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    port = server.address().port;
  });

  afterEach(() => new Promise(resolve => server.close(resolve)));

  test('requires an administrator and returns JSON for admin', async () => {
    const passengerToken = tokenService.sign({ userId: 'passenger', role: ROLES.PASSENGER });
    const adminToken = tokenService.sign({ userId: 'admin', role: ROLES.ADMIN });

    await expect(request(port, '/api/reports/occupancy?from=2099-01-01&to=2099-01-02'))
      .resolves.toMatchObject({ status: 401 });
    await expect(request(port, '/api/reports/occupancy?from=2099-01-01&to=2099-01-02', passengerToken))
      .resolves.toMatchObject({ status: 403 });

    const response = await request(port, '/api/reports/occupancy?from=2099-01-01&to=2099-01-02', adminToken);
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body.toString())).toMatchObject({ rows: [], totals: { total: { occupancyPercentage: 0 } } });
  });

  test('returns a PDF attachment for an administrator', async () => {
    const adminToken = tokenService.sign({ userId: 'admin', role: ROLES.ADMIN });
    const response = await request(port, '/api/reports/occupancy.pdf?from=2099-01-01&to=2099-01-02', adminToken);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/pdf/);
    expect(response.headers['content-disposition']).toContain('occupancy-report.pdf');
    expect(response.body.subarray(0, 4).toString()).toBe('%PDF');
  });
});