const Flight = require('../domain/flight');

class UpdateFlight {
  constructor(flightRepository) {
    this.flightRepository = flightRepository;
  }

  async execute(flightId, changes) {
    const currentFlight = await this.flightRepository.findById(flightId);
    if (!currentFlight) {
      throw new Error('Flight not found');
    }
    const currentData = this._toFlightData(currentFlight);
    const flight = new Flight({ ...currentData, ...changes, id: flightId });
    const duplicate = await this.flightRepository.findByFlightNumber(flight.flightNumber);
    if (duplicate && duplicate.id !== flightId) {
      throw new Error('flightNumber already exists');
    }
    return this.flightRepository.update(flightId, flight);
  }

  _toFlightData(flight) {
    return {
      ...flight,
      operatingDays: flight.operatingDays,
      availabilityPeriod: this._periodData(flight.availabilityPeriod),
      capacity: { economy: flight.capacity.economy, firstClass: flight.capacity.firstClass },
      pricing: { economy: flight.pricing.economy, firstClass: flight.pricing.firstClass }
    };
  }

  _periodData(period) {
    return {
      startDate: period.startDate.toISOString().slice(0, 10),
      endDate: period.endDate.toISOString().slice(0, 10)
    };
  }
}

module.exports = UpdateFlight;
