const FlightInstance = require('../../flights/domain/flight-instance');

class GetAvailability {
  constructor(flightRepository, seatHoldRepository, seatFactory) {
    this.flightRepository = flightRepository;
    this.seatHoldRepository = seatHoldRepository;
    this.seatFactory = seatFactory;
  }

  async execute(flightInstanceId) {
    const identity = FlightInstance.parseId(flightInstanceId);
    const flight = await this.flightRepository.findById(identity.flightId);
    if (!flight) throw new Error('flight not found');
    const instanceId = identity.date
      ? new FlightInstance(flight, identity.date).id
      : flight.id;
    this.seatFactory.ensureForFlight(flight, instanceId);
    return this.seatHoldRepository.getAvailability(instanceId);
  }
}

module.exports = GetAvailability;
