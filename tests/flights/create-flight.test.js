const CreateFlight = require('../../services/flights/use-cases/create-flight');

function validFlight(overrides = {}) {
  return {
    flightNumber: 'AR1234',
    originAirport: 'EZE',
    destinationAirport: 'COR',
    departureTime: '10:00',
    arrivalTime: '11:30',
    operatingDays: ['MON', 'WED'],
    availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-12-31' },
    capacity: { economy: 100, firstClass: 10 },
    pricing: { economy: 50000, firstClass: 100000 },
    ...overrides
  };
}

describe('CreateFlight use case', () => {
  let flightRepository;
  let createFlight;

  beforeEach(() => {
    flightRepository = {
      findByFlightNumber: jest.fn().mockResolvedValue(null),
      create: jest.fn(async flight => flight)
    };
    createFlight = new CreateFlight(flightRepository);
  });

  test('creates and returns a validated active flight', async () => {
    const result = await createFlight.execute(validFlight());

    expect(result).toMatchObject({
      flightNumber: 'AR1234',
      originAirport: 'EZE',
      destinationAirport: 'COR',
      status: 'ACTIVE'
    });
    expect(result.id).toEqual(expect.any(String));
    expect(flightRepository.findByFlightNumber).toHaveBeenCalledWith('AR1234');
    expect(flightRepository.create).toHaveBeenCalledWith(result);
  });

  test('rejects a duplicate flight number without saving', async () => {
    flightRepository.findByFlightNumber.mockResolvedValue({ flightNumber: 'AR1234' });

    await expect(createFlight.execute(validFlight())).rejects.toThrow('flightNumber already exists');
    expect(flightRepository.create).not.toHaveBeenCalled();
  });

  test('rejects invalid business data before checking or saving', async () => {
    await expect(createFlight.execute(validFlight({
      capacity: { economy: 3.5, firstClass: 2 }
    }))).rejects.toThrow('La capacidad de Economy no puede tener decimales.');

    expect(flightRepository.findByFlightNumber).not.toHaveBeenCalled();
    expect(flightRepository.create).not.toHaveBeenCalled();
  });
});
