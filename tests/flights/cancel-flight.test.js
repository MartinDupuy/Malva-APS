'use strict';

const CancelFlight = require('../../services/flights/use-cases/cancel-flight');
const Flight = require('../../services/flights/domain/flight');
const InMemoryFlightRepository = require('../../services/flights/adapters/in-memory-flight-repository');

describe('CancelFlight use case', () => {
  let flightRepository;
  let cancelFlight;

  beforeEach(() => {
    flightRepository = new InMemoryFlightRepository();
    cancelFlight = new CancelFlight(flightRepository);
  });

  function sampleFlight() {
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
    });
  }

  test('successfully cancels an active flight and persists updated status', async () => {
    const flight = sampleFlight();
    await flightRepository.create(flight);

    expect(flight.status).toBe('ACTIVE');

    const result = await cancelFlight.execute('flight-test-1');
    expect(result.status).toBe('CANCELLED');

    const inRepo = await flightRepository.findById('flight-test-1');
    expect(inRepo.status).toBe('CANCELLED');
  });

  test('throws "Flight not found" if flight does not exist', async () => {
    await expect(cancelFlight.execute('non-existent-id')).rejects.toThrow('Flight not found');
  });
});
