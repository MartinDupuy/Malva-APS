'use strict';

const http = require('http');
const { createApp } = require('../../server');
const { Booking, BOOKING_STATUSES } = require('../../services/bookings/domain/booking');

function request(port, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const clientRequest = http.request(
      {
        port,
        host: '127.0.0.1',
        method,
        path,
        headers: body ? { 'Content-Type': 'application/json' } : {},
      },
      (response) => {
        let responseBody = '';
        response.on('data', (chunk) => {
          responseBody += chunk;
        });
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
      }
    );
    clientRequest.on('error', reject);
    clientRequest.end(payload);
  });
}

function sampleFlightData() {
  return {
    flightNumber: 'AR7777',
    originAirport: 'EZE',
    destinationAirport: 'BRC',
    departureTime: '10:00',
    arrivalTime: '12:15',
    operatingDays: ['MON', 'WED', 'FRI'],
    availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-12-31' },
    capacity: { economy: 150, firstClass: 10 },
    pricing: { economy: 75000, firstClass: 150000 },
  };
}

describe('Flight Notification Integration', () => {
  let server;
  let port;
  let mockNotifyFlightChange;

  beforeEach(async () => {
    mockNotifyFlightChange = {
      execute: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
    };

    const app = createApp({
      bookingRepository: 'memory',
      notifyFlightChange: mockNotifyFlightChange,
    });

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    port = server.address().port;
  });

  afterEach(() => new Promise((resolve) => server.close(resolve)));

  test('calls notifyFlightChange with SCHEDULE_CHANGE when flight is updated', async () => {
    const created = await request(port, 'POST', '/api/flights', sampleFlightData());
    expect(created.status).toBe(201);
    const flightId = created.body.id;

    const updated = await request(port, 'PUT', `/api/flights/${flightId}`, {
      departureTime: '15:30',
      arrivalTime: '17:45',
    });

    expect(updated.status).toBe(200);
    expect(updated.body.departureTime).toBe('15:30');

    // Wait a tick for async fire-and-forget notification call
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockNotifyFlightChange.execute).toHaveBeenCalledTimes(1);
    const callArgs = mockNotifyFlightChange.execute.mock.calls[0][0];
    expect(callArgs.changeType).toBe('SCHEDULE_CHANGE');
    expect(callArgs.flight.departureTime).toBe('15:30');
    expect(callArgs.previousFlight.departureTime).toBe('10:00');
  });

  test('calls notifyFlightChange with CANCELLATION when flight is cancelled', async () => {
    const created = await request(port, 'POST', '/api/flights', sampleFlightData());
    expect(created.status).toBe(201);
    const flightId = created.body.id;

    const cancelled = await request(port, 'DELETE', `/api/flights/${flightId}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('CANCELLED');

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockNotifyFlightChange.execute).toHaveBeenCalledTimes(1);
    const callArgs = mockNotifyFlightChange.execute.mock.calls[0][0];
    expect(callArgs.changeType).toBe('CANCELLATION');
    expect(callArgs.flight.status).toBe('CANCELLED');
    expect(callArgs.flight.id).toBe(flightId);
  });

  test('remains resilient (fire-and-forget) when notification execution fails', async () => {
    mockNotifyFlightChange.execute.mockRejectedValue(new Error('Notification service down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const created = await request(port, 'POST', '/api/flights', sampleFlightData());
    const flightId = created.body.id;

    const cancelled = await request(port, 'DELETE', `/api/flights/${flightId}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('CANCELLED');

    consoleSpy.mockRestore();
  });
});

describe('FlightController backwards compatibility without notifier', () => {
  let server;
  let port;

  beforeEach(async () => {
    const app = createApp({
      bookingRepository: 'memory',
      // no notifyFlightChange provided
    });

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    port = server.address().port;
  });

  afterEach(() => new Promise((resolve) => server.close(resolve)));

  test('updates and cancels flights without errors when notifier is null', async () => {
    const created = await request(port, 'POST', '/api/flights', sampleFlightData());
    const flightId = created.body.id;

    const updated = await request(port, 'PUT', `/api/flights/${flightId}`, { departureTime: '13:00' });
    expect(updated.status).toBe(200);
    expect(updated.body.departureTime).toBe('13:00');

    const cancelled = await request(port, 'DELETE', `/api/flights/${flightId}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('CANCELLED');
  });
});

describe('End-to-End Flight Change Notification Flow', () => {
  let server;
  let port;
  let mockEmailSender;
  let app;

  beforeEach(async () => {
    mockEmailSender = {
      send: jest.fn().mockResolvedValue({ messageId: 'test-e2e-msg' }),
    };

    app = createApp({
      bookingRepository: 'memory',
      emailSender: mockEmailSender,
    });

    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    port = server.address().port;
  });

  afterEach(() => new Promise((resolve) => server.close(resolve)));

  test('confirmed passengers receive emails when flight is cancelled', async () => {
    // 1. Create a flight
    const flightRes = await request(port, 'POST', '/api/flights', sampleFlightData());
    const flightId = flightRes.body.id;

    // 2. Obtain availability and seats
    const availRes = await request(port, 'GET', `/api/flights/${flightId}/availability`);
    const availableSeats = availRes.body;
    expect(availableSeats.length).toBeGreaterThanOrEqual(2);

    // 3. Create a booking
    const bookingRes = await request(port, 'POST', '/api/bookings', {
      flightInstanceId: flightId,
      passengers: [
        { seatId: availableSeats[0].id, name: 'Lucia Ramirez', email: 'lucia@example.com' },
        { seatId: availableSeats[1].id, name: 'Martin Fierro', email: 'martin@example.com' },
      ],
    });
    expect(bookingRes.status).toBe(201);
    const bookingId = bookingRes.body.id;

    // 4. Confirm the booking
    const confirmRes = await request(port, 'POST', `/api/bookings/${bookingId}/confirm`);
    expect(confirmRes.status).toBe(200);

    // 5. Cancel the flight from admin API
    const cancelRes = await request(port, 'DELETE', `/api/flights/${flightId}`);
    expect(cancelRes.status).toBe(200);

    // Wait for async fire-and-forget emails
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 6. Verify that each confirmed passenger received the cancellation email
    expect(mockEmailSender.send).toHaveBeenCalledTimes(2);

    const sentEmails = mockEmailSender.send.mock.calls.map((call) => call[0]);
    const recipients = sentEmails.map((e) => e.to);
    expect(recipients).toContain('lucia@example.com');
    expect(recipients).toContain('martin@example.com');

    for (const email of sentEmails) {
      expect(email.subject).toBe('Cancelación de su vuelo AR7777');
      expect(email.body).toContain('Malva Airlines');
      expect(email.body).toContain('cancelado');
    }
  });

  test('confirmed passengers receive emails when flight schedule is updated', async () => {
    // 1. Create a flight
    const flightRes = await request(port, 'POST', '/api/flights', sampleFlightData());
    const flightId = flightRes.body.id;

    // 2. Get seats
    const availRes = await request(port, 'GET', `/api/flights/${flightId}/availability`);
    const availableSeats = availRes.body;

    // 3. Create & confirm booking
    const bookingRes = await request(port, 'POST', '/api/bookings', {
      flightInstanceId: flightId,
      passengers: [
        { seatId: availableSeats[0].id, name: 'Esteban Quito', email: 'esteban@example.com' },
      ],
    });
    await request(port, 'POST', `/api/bookings/${bookingRes.body.id}/confirm`);

    // 4. Update the flight schedule
    const updateRes = await request(port, 'PUT', `/api/flights/${flightId}`, {
      departureTime: '18:00',
      arrivalTime: '20:15',
    });
    expect(updateRes.status).toBe(200);

    // Wait for async emails
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockEmailSender.send).toHaveBeenCalledTimes(1);
    const email = mockEmailSender.send.mock.calls[0][0];
    expect(email.to).toBe('esteban@example.com');
    expect(email.subject).toBe('Cambio de horario en su vuelo AR7777');
    expect(email.body).toContain('Esteban Quito');
    expect(email.body).toContain('10:00'); // old
    expect(email.body).toContain('18:00'); // new
  });
});
