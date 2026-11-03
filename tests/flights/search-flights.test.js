const Flight = require('../../services/flights/domain/flight');
const SearchFlights = require('../../services/flights/use-cases/search-flights');

function makeFlight({
  id = 'flight-1',
  flightNumber = 'AR1234',
  originAirport = 'EZE',
  destinationAirport = 'COR',
  operatingDays = ['MON'],
  status = 'ACTIVE',
  capacity = { economy: 4, firstClass: 2 },
  pricing = { economy: 50000, firstClass: 120000 }
} = {}) {
  return new Flight({
    id,
    flightNumber,
    originAirport,
    destinationAirport,
    departureTime: '10:00',
    arrivalTime: '11:30',
    operatingDays,
    availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-12-31' },
    capacity,
    pricing,
    status
  });
}

function availableSeats(economy, firstClass) {
  return [
    ...Array.from({ length: economy }, (_, index) => ({
      seat: { id: `E${index + 1}`, cabinClass: 'economy' }, status: 'AVAILABLE'
    })),
    ...Array.from({ length: firstClass }, (_, index) => ({
      seat: { id: `F${index + 1}`, cabinClass: 'firstClass' }, status: 'AVAILABLE'
    })),
    { seat: { id: 'E-held', cabinClass: 'economy' }, status: 'HELD' },
    { seat: { id: 'F-confirmed', cabinClass: 'firstClass' }, status: 'CONFIRMED' }
  ];
}

describe('SearchFlights use case', () => {
  test('filters route, operation date, fare and status, and returns the dated instance', async () => {
    const flightRepository = {
      findAll: jest.fn().mockResolvedValue([
        makeFlight({ id: 'match' }),
        makeFlight({ id: 'wrong-route', destinationAirport: 'MDQ' }),
        makeFlight({ id: 'wrong-day', operatingDays: ['TUE'] }),
        makeFlight({ id: 'cancelled', status: 'CANCELLED' }),
        makeFlight({ id: 'too-expensive', flightNumber: 'AR5678', pricing: { economy: 90000, firstClass: 120000 } })
      ])
    };
    const availabilityService = { execute: jest.fn().mockResolvedValue(availableSeats(4, 2)) };
    const searchFlights = new SearchFlights(flightRepository, availabilityService);

    const results = await searchFlights.execute({
      origin: 'EZE', destination: 'COR', date: '2099-01-05',
      passengers: '2', cabinClass: 'economy', tariff: '60000'
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'match', flightInstanceId: 'match::2099-01-05',
      availableSeats: { economy: 4, firstClass: 2 }
    });
    expect(availabilityService.execute).toHaveBeenCalledTimes(1);
    expect(availabilityService.execute).toHaveBeenCalledWith('match::2099-01-05');
  });

  test('excludes flights without enough currently available seats in the requested class', async () => {
    const flightRepository = { findAll: jest.fn().mockResolvedValue([
      makeFlight({ id: 'flight-1', capacity: { economy: 8, firstClass: 0 } }),
      makeFlight({ id: 'flight-2', flightNumber: 'AR5678', capacity: { economy: 8, firstClass: 0 } })
    ]) };
    const availabilityService = {
      execute: jest.fn(async id => id === 'flight-1'
        ? availableSeats(1, 0)
        : availableSeats(3, 0))
    };
    const searchFlights = new SearchFlights(flightRepository, availabilityService);

    const results = await searchFlights.execute({ passengers: 2, cabinClass: 'economy' });

    expect(results.map(flight => flight.id)).toEqual(['flight-2']);
    expect(results[0].availableSeats.economy).toBe(3);
  });

  test('accepts a fare when at least one allowed class is within the maximum', async () => {
    const flightRepository = { findAll: jest.fn().mockResolvedValue([
      makeFlight({ pricing: { economy: 50000, firstClass: 120000 } })
    ]) };
    const results = await new SearchFlights(flightRepository).execute({ maxFare: 60000 });

    expect(results).toHaveLength(1);
  });

  test.each([
    [{ passengers: 0 }, 'passengers must be a positive integer'],
    [{ passengers: 1.5 }, 'passengers must be a positive integer'],
    [{ tariff: -1 }, 'maxFare must be a non-negative number'],
    [{ cabinClass: 'business' }, 'cabinClass must be all, economy or firstClass'],
    [{ date: '2099-02-31' }, 'date must be a real calendar date']
  ])('rejects invalid search criteria %#', async (criteria, message) => {
    const searchFlights = new SearchFlights({ findAll: jest.fn() });

    await expect(searchFlights.execute(criteria)).rejects.toThrow(message);
  });
});
