'use strict';

const UpdateFlight = require('../../services/flights/use-cases/update-flight');
const Flight = require('../../services/flights/domain/flight');
const InMemoryFlightRepository = require('../../services/flights/adapters/in-memory-flight-repository');

describe('UpdateFlight use case', () => {
  let flightRepository;
  let updateFlight;

  beforeEach(() => {
    flightRepository = new InMemoryFlightRepository();
    updateFlight = new UpdateFlight(flightRepository);
  });

  function sampleFlight(overrides = {}) {
    return new Flight({
      id: 'flight-test-1',
      flightNumber: 'AR1234',
      originAirport: 'EZE',
      destinationAirport: 'COR',
      departureTime: '10:00',
      arrivalTime: '11:30',
      operatingDays: ['MON', 'WED'],
      availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-12-31' },
      capacity: { economy: 100, firstClass: 10 },
      pricing: { economy: 50000, firstClass: 100000 },
      ...overrides,
    });
  }

  test('successfully updates departure and arrival times of an existing flight', async () => {
    await flightRepository.create(sampleFlight());

    const result = await updateFlight.execute('flight-test-1', {
      departureTime: '14:00',
      arrivalTime: '15:30',
    });

    expect(result.departureTime).toBe('14:00');
    expect(result.arrivalTime).toBe('15:30');

    const inRepo = await flightRepository.findById('flight-test-1');
    expect(inRepo.departureTime).toBe('14:00');
    expect(inRepo.arrivalTime).toBe('15:30');
  });

  test('throws "Flight not found" if flight does not exist', async () => {
    await expect(
      updateFlight.execute('non-existent-id', { departureTime: '12:00' })
    ).rejects.toThrow('Flight not found');
  });

  test('throws "flightNumber already exists" if updated flightNumber conflicts with another flight', async () => {
    await flightRepository.create(sampleFlight({ id: 'f-1', flightNumber: 'AR1111' }));
    await flightRepository.create(sampleFlight({ id: 'f-2', flightNumber: 'AR2222' }));

    await expect(
      updateFlight.execute('f-2', { flightNumber: 'AR1111' })
    ).rejects.toThrow('flightNumber already exists');
  });

  test('allows updating own flight details keeping same flightNumber', async () => {
    await flightRepository.create(sampleFlight({ id: 'f-1', flightNumber: 'AR1111' }));

    const updated = await updateFlight.execute('f-1', {
      flightNumber: 'AR1111',
      departureTime: '18:00',
    });

    expect(updated.departureTime).toBe('18:00');
    expect(updated.flightNumber).toBe('AR1111');
  });
});
