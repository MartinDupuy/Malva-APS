const { createApp } = require('../../server');

describe('initial users', () => {
  let app;
  let server;
  let port;

  beforeEach(async () => {
    app = createApp({ bookingRepository: 'memory' });
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    port = server.address().port;
  });

  afterEach(() => new Promise(resolve => server.close(resolve)));

  test('allows the seeded administrator to log in', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@malva.com', password: '12345678' }),
    });

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({ email: 'admin@malva.com', name: 'admin', role: 'ADMIN' });
    expect(typeof body.token).toBe('string');
  });
});