'use strict';

const { Booking, BOOKING_STATUSES } = require('../../services/bookings/domain/booking');
const InMemoryBookingRepository = require('../../services/bookings/adapters/in-memory-booking-repository');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn().mockImplementation((queryText) => {
      if (queryText.includes('CREATE TABLE')) {
        return Promise.resolve({ rows: [] });
      }
      if (queryText.includes('SELECT * FROM bookings WHERE flight_instance_id')) {
        return Promise.resolve({
          rows: [
            {
              id: 'b-pg-1',
              flight_instance_id: 'flight-pg',
              hold_id: 'h-1',
              passengers: JSON.stringify([{ seatId: 'E1', name: 'Test PG', email: 'test@pg.com' }]),
              status: 'CONFIRMED'
            }
          ]
        });
      }
      return Promise.resolve({ rows: [] });
    }),
  };
  return { Pool: jest.fn(() => mPool) };
});

const PostgresBookingRepository = require('../../services/bookings/adapters/postgres-booking-repository');

describe('InMemoryBookingRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new InMemoryBookingRepository();
  });

  test('returns an empty array when no bookings match flightInstanceId', () => {
    const results = repository.findByFlightInstanceId('non-existent-flight');
    expect(results).toEqual([]);
  });

  test('returns only CONFIRMED bookings matching flightInstanceId', () => {
    const bookingConfirmed = new Booking({
      id: 'booking-1',
      flightInstanceId: 'flight-100',
      passengers: [{ seatId: 'E1', name: 'Juan Perez', email: 'juan@example.com' }],
      status: BOOKING_STATUSES.CONFIRMED,
    });
    const bookingHeld = new Booking({
      id: 'booking-2',
      flightInstanceId: 'flight-100',
      passengers: [{ seatId: 'E2', name: 'Maria Lopez', email: 'maria@example.com' }],
      status: BOOKING_STATUSES.HELD,
    });
    const bookingCancelled = new Booking({
      id: 'booking-3',
      flightInstanceId: 'flight-100',
      passengers: [{ seatId: 'E3', name: 'Carlos Gomez', email: 'carlos@example.com' }],
      status: BOOKING_STATUSES.CANCELLED,
    });

    repository.create(bookingConfirmed);
    repository.create(bookingHeld);
    repository.create(bookingCancelled);

    const results = repository.findByFlightInstanceId('flight-100');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('booking-1');
    expect(results[0].status).toBe(BOOKING_STATUSES.CONFIRMED);
  });

  test('returns multiple confirmed bookings for the same flightInstanceId', () => {
    const booking1 = new Booking({
      id: 'booking-1',
      flightInstanceId: 'flight-200',
      passengers: [{ seatId: 'E1', name: 'Ana Gomez', email: 'ana@example.com' }],
      status: BOOKING_STATUSES.CONFIRMED,
    });
    const booking2 = new Booking({
      id: 'booking-2',
      flightInstanceId: 'flight-200',
      passengers: [{ seatId: 'E2', name: 'Pedro Diaz', email: 'pedro@example.com' }],
      status: BOOKING_STATUSES.CONFIRMED,
    });
    const bookingOtherFlight = new Booking({
      id: 'booking-3',
      flightInstanceId: 'flight-999',
      passengers: [{ seatId: 'E3', name: 'Sofia Ruiz', email: 'sofia@example.com' }],
      status: BOOKING_STATUSES.CONFIRMED,
    });

    repository.create(booking1);
    repository.create(booking2);
    repository.create(bookingOtherFlight);

    const results = repository.findByFlightInstanceId('flight-200');
    expect(results).toHaveLength(2);
    expect(results.map((b) => b.id)).toEqual(['booking-1', 'booking-2']);
  });
});

describe('PostgresBookingRepository - findByFlightInstanceId', () => {
  test('queries postgres for confirmed bookings and maps domain entities', async () => {
    const repo = new PostgresBookingRepository({ connectionString: 'postgres://localhost/test' });
    const results = await repo.findByFlightInstanceId('flight-pg');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('b-pg-1');
    expect(results[0].flightInstanceId).toBe('flight-pg');
    expect(results[0].status).toBe('CONFIRMED');
    expect(results[0].passengers[0].name).toBe('Test PG');
  });
});
