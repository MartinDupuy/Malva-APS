class InMemoryFlightRepository {
  constructor() {
    this.flights = new Map();
  }

  async create(flight) {
    this.flights.set(flight.id, flight);
    return flight;
  }

  async update(flightId, flight) {
    if (!this.flights.has(flightId)) {
      throw new Error('Flight not found');
    }
    this.flights.set(flightId, flight);
    return flight;
  }

  async findById(flightId) {
    return this.flights.get(flightId) || null;
  }

  async findByFlightNumber(flightNumber) {
    return [...this.flights.values()]
      .find(flight => flight.flightNumber === flightNumber) || null;
  }

  async findAll() {
    return [...this.flights.values()];
  }

  async delete(flightId) {
    return this.flights.delete(flightId);
  }
}

module.exports = InMemoryFlightRepository;