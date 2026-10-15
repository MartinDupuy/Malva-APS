const { BOOKING_STATUSES, Booking, MAX_PASSENGERS } = require('../../services/bookings/domain/booking');
const InMemoryBookingRepository = require('../../services/bookings/adapters/in-memory-booking-repository');
const CreateBooking = require('../../services/bookings/use-cases/create-booking');
const Seat = require('../../services/seats/domain/seat');
const { InMemorySeatHoldRepository } = require('../../services/seats/adapters/in-memory-seat-hold-repository');

describe('Booking', () => {
  const passengers = [
    { seatId: 'E1', name: 'Ana Perez', email: 'ana@example.com' },
    { seatId: 'E2', name: 'Luis Gomez', email: 'luis@example.com' }
  ];

  test('validates and transitions a held booking', () => {
    const booking = new Booking({ flightInstanceId: 'flight-1', passengers });

    expect(booking.status).toBe(BOOKING_STATUSES.HELD);
    expect(Object.isFrozen(booking.passengers)).toBe(true);
    expect(() => booking.confirm()).not.toThrow();
    expect(booking.status).toBe(BOOKING_STATUSES.CONFIRMED);
    expect(() => booking.confirm()).toThrow('only a held booking');
  });

  test(`rejects more than ${MAX_PASSENGERS} passengers`, () => {
    const tooManyPassengers = Array.from({ length: MAX_PASSENGERS + 1 }, (_, index) => ({
      seatId: `E${index}`,
      name: `Passenger ${index}`,
      email: `passenger${index}@example.com`
    }));

    expect(() => new Booking({ flightInstanceId: 'flight-1', passengers: tooManyPassengers }))
      .toThrow(`between 1 and ${MAX_PASSENGERS}`);
  });

  test('creates a booking only after all requested seats are held', () => {
    const seatHoldRepository = new InMemorySeatHoldRepository({
      seatsByFlightInstance: new Map([['flight-1', [
        new Seat({ id: 'E1', number: '1A', cabinClass: 'economy' }),
        new Seat({ id: 'E2', number: '1B', cabinClass: 'economy' })
      ]]])
    });
    const bookingRepository = new InMemoryBookingRepository();
    const createBooking = new CreateBooking(bookingRepository, seatHoldRepository);

    const booking = createBooking.execute({ flightInstanceId: 'flight-1', passengers });

    expect(bookingRepository.findById(booking.id)).toBe(booking);
    expect(booking.holdId).toBeTruthy();
    expect(seatHoldRepository.getById(booking.holdId).seatIds).toEqual(['E1', 'E2']);
  });

  test('does not persist a booking when one requested seat is unavailable', () => {
    const seatHoldRepository = new InMemorySeatHoldRepository({
      seatsByFlightInstance: new Map([['flight-1', [
        new Seat({ id: 'E1', number: '1A', cabinClass: 'economy' })
      ]]]),
    });
    const bookingRepository = new InMemoryBookingRepository();
    const createBooking = new CreateBooking(bookingRepository, seatHoldRepository);

    expect(() => createBooking.execute({ flightInstanceId: 'flight-1', passengers }))
      .toThrow('do not belong to the flight instance');
    expect(bookingRepository.bookings.size).toBe(0);
  });
});