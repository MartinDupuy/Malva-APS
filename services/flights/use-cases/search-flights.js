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
    const hasPassengerFilter = criteria.passengers !== undefined && criteria.passengers !== '';
    const passengers = hasPassengerFilter ? Number(criteria.passengers) : null;
    const fare = criteria.maxFare ?? criteria.tariff;
    const maxFare = fare === undefined ? null : Number(fare);
    const cabinClass = criteria.cabinClass || 'all';
    if (hasPassengerFilter && (!Number.isInteger(passengers) || passengers < 1)) {
      throw new Error('passengers must be a positive integer');
    }
    if (maxFare !== null && (!Number.isFinite(maxFare) || maxFare < 0)) {
      throw new Error('maxFare must be a non-negative number');
    }
    if (!['all', 'economy', 'firstClass'].includes(cabinClass)) {
      throw new Error('cabinClass must be all, economy or firstClass');
    }
    if (criteria.date) this._validateDate(criteria.date);
    return {
      ...criteria,
      originAirport: criteria.originAirport || criteria.origin,
      destinationAirport: criteria.destinationAirport || criteria.destination,
      passengers,
      maxFare,
      cabinClass
    };
  }

  _matches(flight, criteria) {
    return flight.status === 'ACTIVE'
      && this._matchesRoute(flight, criteria)
      && this._matchesDate(flight, criteria.date)
      && this._matchesCapacity(flight, criteria)
      && this._matchesFare(flight, criteria.maxFare, criteria.cabinClass);
  }

  _matchesRoute(flight, criteria) {
    return (!criteria.originAirport || flight.originAirport === criteria.originAirport)
      && (!criteria.destinationAirport || flight.destinationAirport === criteria.destinationAirport);
  }

  _matchesDate(flight, date) {
    if (!date) return true;
    this._validateDate(date);
    return date >= this._dateValue(flight.availabilityPeriod.startDate)
      && date <= this._dateValue(flight.availabilityPeriod.endDate)
      && flight.operatingDays.includes(DAY_CODES[new Date(`${date}T00:00:00Z`).getUTCDay()]);
  }

  _dateValue(date) {
    return date.toISOString().slice(0, 10);
  }

  _validateDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must use YYYY-MM-DD format');
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new Error('date must be a real calendar date');
    }
  }

  _matchesFare(flight, maxFare, cabinClass) {
    if (maxFare === null) return true;
    const prices = cabinClass === 'firstClass'
      ? [flight.pricing.firstClass]
      : cabinClass === 'economy' ? [flight.pricing.economy] : [flight.pricing.economy, flight.pricing.firstClass];
    return prices.some(price => this._priceInUnits(price) <= maxFare);
  }

  _matchesCapacity(flight, criteria) {
    return criteria.passengers === null
      || flight.capacity.hasSeatsFor(criteria.passengers, criteria.cabinClass);
  }

  _priceInUnits(price) {
    return price.amount / 100;
  }
}

module.exports = SearchFlights;
