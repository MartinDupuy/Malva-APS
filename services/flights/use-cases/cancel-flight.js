class CancelFlight {
	constructor(flightRepository) {
		this.flightRepository = flightRepository;
	}

	async execute(flightId) {
		const flight = await this.flightRepository.findById(flightId);
		if (!flight) {
			throw new Error('Flight not found');
		}
		flight.cancel();
		return this.flightRepository.update(flightId, flight);
	}
}

module.exports = CancelFlight;
