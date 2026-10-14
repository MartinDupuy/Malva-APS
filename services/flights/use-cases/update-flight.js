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
    const flight = new Flight({ ...currentFlight, ...changes, id: flightId });
    const duplicate = await this.flightRepository.findByFlightNumber(flight.flightNumber);
    if (duplicate && duplicate.id !== flightId) {
      throw new Error('flightNumber already exists');
    }
    return this.flightRepository.update(flightId, flight);
  }
}

module.exports = UpdateFlight;
