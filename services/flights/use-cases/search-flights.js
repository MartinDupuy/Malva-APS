const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

class SearchFlights {
  constructor(flightRepository) {
    this.flightRepository = flightRepository;
  }

  async execute(criteria = {}) {
    const filters = this._normalizeCriteria(criteria);
    const flights = await this.flightRepository.findAll();
    return flights.filter(flight => this._matches(flight, filters));
  }

  _normalizeCriteria(criteria) {
    const passengers = criteria.passengers === undefined ? 1 : Number(criteria.passengers);
    const fare = criteria.maxFare ?? criteria.tariff;
    const maxFare = fare === undefined ? null : Number(fare);
    if (!Number.isInteger(passengers) || passengers < 1) {
      throw new Error('passengers must be a positive integer');
    }
    if (maxFare !== null && (!Number.isFinite(maxFare) || maxFare < 0)) {
      throw new Error('maxFare must be a non-negative number');
    }
    return {
      ...criteria,
      originAirport: criteria.originAirport || criteria.origin,
      destinationAirport: criteria.destinationAirport || criteria.destination,
      passengers,
      maxFare
    };
  }

  _matches(flight, criteria) {
    return flight.status === 'ACTIVE'
      && this._matchesRoute(flight, criteria)
      && this._matchesDate(flight, criteria.date)
      && flight.capacity.hasSeatsFor(criteria.passengers)
      && this._matchesFare(flight, criteria.maxFare);
  }

  _matchesRoute(flight, criteria) {
    return (!criteria.originAirport || flight.originAirport === criteria.originAirport)
      && (!criteria.destinationAirport || flight.destinationAirport === criteria.destinationAirport);
  }

  _matchesDate(flight, date) {
    if (!date) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must use YYYY-MM-DD format');
    return date >= this._dateValue(flight.availabilityPeriod.startDate)
      && date <= this._dateValue(flight.availabilityPeriod.endDate)
      && flight.operatingDays.includes(DAY_CODES[new Date(`${date}T00:00:00Z`).getUTCDay()]);
  }

  _dateValue(date) {
    return date.toISOString().slice(0, 10);
  }

  _matchesFare(flight, maxFare) {
    return maxFare === null || flight.pricing.economy.amount / 100 <= maxFare;
  }
}

module.exports = SearchFlights;
