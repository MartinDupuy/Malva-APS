const crypto = require('crypto');

const BOOKING_STATUSES = Object.freeze({
  HELD: 'HELD',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED'
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSENGERS = 9;

class Booking {
  constructor({ id = crypto.randomUUID(), flightInstanceId, holdId = null, passengers, status = BOOKING_STATUSES.HELD }) {
    if (typeof flightInstanceId !== 'string' || flightInstanceId.trim() === '') {
      throw new Error('flightInstanceId is required');
    }
    if (!Array.isArray(passengers) || passengers.length < 1 || passengers.length > MAX_PASSENGERS) {
      throw new Error(`a booking must contain between 1 and ${MAX_PASSENGERS} passengers`);
    }
    if (new Set(passengers.map(({ seatId }) => seatId)).size !== passengers.length) {
      throw new Error('passengers cannot share a seat');
    }
    if (!Object.values(BOOKING_STATUSES).includes(status)) {
      throw new Error('booking status is invalid');
    }

    this.id = id;
    this.flightInstanceId = flightInstanceId.trim();
    this.holdId = holdId;
    this.passengers = Object.freeze(passengers.map((passenger) => this._passenger(passenger)));
    this.status = status;
  }

  confirm() {
    if (this.status !== BOOKING_STATUSES.HELD) {
      throw new Error('only a held booking can be confirmed');
    }
    this.status = BOOKING_STATUSES.CONFIRMED;
    return this;
  }

  cancel() {
    if (this.status === BOOKING_STATUSES.HELD) {
      this.status = BOOKING_STATUSES.CANCELLED;
    }
    return this;
  }

  _passenger({ seatId, name, email }) {
    if (typeof seatId !== 'string' || seatId.trim() === '') {
      throw new Error('passenger seatId is required');
    }
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('passenger name is required');
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      throw new Error('passenger email must be valid');
    }

    return Object.freeze({ seatId: seatId.trim(), name: name.trim(), email: email.trim() });
  }
}

module.exports = { BOOKING_STATUSES, MAX_PASSENGERS, Booking };