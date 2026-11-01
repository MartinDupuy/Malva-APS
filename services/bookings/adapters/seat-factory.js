const Seat = require('../../seats/domain/seat');

class SeatFactory {
  constructor(seatsByFlightInstance) {
    this.seatsByFlightInstance = seatsByFlightInstance;
  }

  ensureForFlight(flight, flightInstanceId = flight.id) {
    if (this.seatsByFlightInstance.has(flightInstanceId)) return;
    const seats = [
      ...this._createSeats(flight.capacity.economy, 'E', 'economy'),
      ...this._createSeats(flight.capacity.firstClass, 'F', 'firstClass')
    ];
    this.seatsByFlightInstance.set(flightInstanceId, seats);
  }

  _createSeats(count, prefix, cabinClass) {
    return Array.from({ length: count }, (_, index) => new Seat({
      id: `${prefix}${index + 1}`,
      number: `${index + 1}${prefix}`,
      cabinClass
    }));
  }
}

module.exports = SeatFactory;
