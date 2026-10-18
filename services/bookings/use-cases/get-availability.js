class GetAvailability {
  constructor(flightRepository, seatHoldRepository, seatFactory) {
    this.flightRepository = flightRepository;
    this.seatHoldRepository = seatHoldRepository;
    this.seatFactory = seatFactory;
  }

  async execute(flightInstanceId) {
    const flight = await this.flightRepository.findById(flightInstanceId);
    if (!flight) throw new Error('flight not found');
    this.seatFactory.ensureForFlight(flight);
    return this.seatHoldRepository.getAvailability(flightInstanceId);
  }
}

module.exports = GetAvailability;