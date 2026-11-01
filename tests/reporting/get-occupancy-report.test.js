const Flight = require('../../services/flights/domain/flight');
const FlightInstance = require('../../services/flights/domain/flight-instance');
const BookingRepository = require('../../services/bookings/adapters/in-memory-booking-repository');
const SeatFactory = require('../../services/bookings/adapters/seat-factory');
const { Booking, BOOKING_STATUSES } = require('../../services/bookings/domain/booking');
const GetOccupancyReport = require('../../services/reporting/use-cases/get-occupancy-report');

describe('GetOccupancyReport', () => {
  test('aggregates confirmed seats by class over inclusive operating dates', async () => {
    const flight = new Flight({
      id: 'flight-1',
      flightNumber: 'MA-101',
      originAirport: 'EZE',
      destinationAirport: 'MEX',
      departureTime: '08:00',
      arrivalTime: '12:00',
      operatingDays: ['MON', 'WED'],
      availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-01-31' },
      capacity: { economy: 2, firstClass: 1 },
      pricing: { economy: 100, firstClass: 250 }
    });
    const bookingRepository = new BookingRepository();
    const seatsByFlightInstance = new Map();
    const seatFactory = new SeatFactory(seatsByFlightInstance);
    const instanceId = FlightInstance.createId(flight.id, '2099-01-05');
    await bookingRepository.create(new Booking({
      id: 'booking-confirmed',
      flightInstanceId: instanceId,
      passengers: [
        { seatId: 'E1', name: 'Ana', email: 'ana@example.com' },
        { seatId: 'F1', name: 'Luis', email: 'luis@example.com' }
      ],
      status: BOOKING_STATUSES.CONFIRMED
    }));
    await bookingRepository.create(new Booking({
      id: 'booking-held',
      flightInstanceId: instanceId,
      passengers: [{ seatId: 'E2', name: 'Eva', email: 'eva@example.com' }],
      status: BOOKING_STATUSES.HELD
    }));

    const report = await new GetOccupancyReport({
      flightRepository: { findAll: async () => [flight] },
      bookingRepository,
      seatFactory
    }).execute({ from: '2099-01-04', to: '2099-01-08' });

    expect(report.rows).toHaveLength(2);
    expect(report.rows[0]).toMatchObject({
      date: '2099-01-05',
      classes: {
        economy: { capacity: 2, occupied: 1, available: 1, occupancyPercentage: 50 },
        firstClass: { capacity: 1, occupied: 1, available: 0, occupancyPercentage: 100 }
      }
    });
    expect(report.totals.total).toMatchObject({ capacity: 6, occupied: 2, available: 4, occupancyPercentage: 33.33 });
  });

  test('rejects invalid ranges and cabin classes', async () => {
    const report = new GetOccupancyReport({ flightRepository: { findAll: async () => [] } });

    await expect(report.execute({ from: '2099-01-02', to: '2099-01-01' }))
      .rejects.toThrow('from must be before or equal to to');
    await expect(report.execute({ from: '2099-01-01', to: '2099-01-02', cabinClass: 'business' }))
      .rejects.toThrow('cabinClass must be all, economy or firstClass');
  });
});