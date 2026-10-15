const Seat = require('../../services/seats/domain/seat');
const { CABIN_CLASSES, normalizeCabinClass } = require('../../services/seats/domain/cabin-class');
const { HOLD_STATUSES, SeatHold } = require('../../services/seats/domain/seat-hold');
const {
  InMemorySeatHoldRepository,
  MAX_SEATS_PER_BOOKING
} = require('../../services/seats/adapters/in-memory-seat-hold-repository');

describe('seat domain', () => {
  const seats = [
    new Seat({ id: 'E1', number: '1A', cabinClass: CABIN_CLASSES.ECONOMY }),
    new Seat({ id: 'F1', number: '1A', cabinClass: CABIN_CLASSES.FIRST_CLASS })
  ];

  test('accepts the supported cabin classes', () => {
    expect(normalizeCabinClass('economy')).toBe('economy');
    expect(normalizeCabinClass('firstClass')).toBe('firstClass');
    expect(() => normalizeCabinClass('business')).toThrow('cabinClass');
  });

  test('expires an active hold at its deadline', () => {
    const now = new Date('2026-10-15T12:00:00.000Z');
    const hold = new SeatHold({
      bookingId: 'booking-1',
      flightInstanceId: 'flight-1',
      seatIds: ['E1'],
      expiresAt: new Date(now.getTime() + 1_000)
    });

    expect(hold.isActive(now)).toBe(true);
    expect(hold.isActive(new Date(now.getTime() + 1_000))).toBe(false);
    expect(hold.status).toBe(HOLD_STATUSES.EXPIRED);
  });

  test('holds multiple seats atomically and rejects a conflicting request', () => {
    const repository = new InMemorySeatHoldRepository({
      seatsByFlightInstance: new Map([['flight-1', seats]])
    });

    const firstHold = repository.createHold({
      bookingId: 'booking-1',
      flightInstanceId: 'flight-1',
      seatIds: ['E1']
    });

    expect(() => repository.createHold({
      bookingId: 'booking-2',
      flightInstanceId: 'flight-1',
      seatIds: ['F1', 'E1']
    })).toThrow('already held');

    expect(repository.getAvailability('flight-1').map(({ status }) => status)).toEqual([
      'HELD',
      'AVAILABLE'
    ]);
    expect(repository.getById(firstHold.id).status).toBe(HOLD_STATUSES.ACTIVE);
  });

  test(`rejects more than ${MAX_SEATS_PER_BOOKING} seats`, () => {
    const repository = new InMemorySeatHoldRepository();
    const seatIds = Array.from({ length: MAX_SEATS_PER_BOOKING + 1 }, (_, index) => `E${index}`);

    expect(() => repository.createHold({
      bookingId: 'booking-1',
      flightInstanceId: 'flight-1',
      seatIds
    })).toThrow(`between 1 and ${MAX_SEATS_PER_BOOKING}`);
  });
});