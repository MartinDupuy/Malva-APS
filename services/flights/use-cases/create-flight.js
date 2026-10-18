const Flight = require('../domain/flight');

class CreateFlight {
	constructor(flightRepository) {
		this.flightRepository = flightRepository;
	}

	async execute(data) {
		const flight = new Flight(data);
		const existing = await this.flightRepository.findByFlightNumber(flight.flightNumber);
		if (existing) {
			throw new Error('flightNumber already exists');
		}
		return this.flightRepository.create(flight);
	}
}

module.exports = CreateFlight;
