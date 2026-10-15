const { HOLD_STATUSES, SeatHold } = require('../domain/seat-hold');

const MAX_SEATS_PER_BOOKING = 9;
const DEFAULT_TTL_MS = 10 * 60 * 1000;

class InMemorySeatHoldRepository {
  constructor({ seatsByFlightInstance = new Map(), clock = () => new Date() } = {}) {
    this.seatsByFlightInstance = seatsByFlightInstance;
    this.clock = clock;
    this.holds = new Map();
  }

  getAvailability(flightInstanceId) {
    const seats = this.seatsByFlightInstance.get(flightInstanceId) || [];
    return seats.map((seat) => ({
      seat,
      status: this._activeHoldFor(flightInstanceId, seat.id) ? 'HELD' : 'AVAILABLE'
    }));
  }

  createHold({ bookingId, flightInstanceId, seatIds, ttlMs = DEFAULT_TTL_MS }) {
    this._validateSeatCount(seatIds);

    const seats = this.seatsByFlightInstance.get(flightInstanceId) || [];
    const knownSeatIds = new Set(seats.map((seat) => seat.id));
    if (seatIds.some((seatId) => !knownSeatIds.has(seatId))) {
      throw new Error('one or more seats do not belong to the flight instance');
    }

    const now = this.clock();
    if (seatIds.some((seatId) => this._activeHoldFor(flightInstanceId, seatId, now))) {
      throw new Error('one or more seats are already held');
    }

    const hold = new SeatHold({
      bookingId,
      flightInstanceId,
      seatIds,
      expiresAt: new Date(now.getTime() + ttlMs)
    });
    this.holds.set(hold.id, hold);
    return hold;
  }

  getById(holdId) {
    return this.holds.get(holdId) || null;
  }

  confirm(holdId) {
    const hold = this._requiredHold(holdId);
    hold.confirm(this.clock());
    return hold;
  }

  cancel(holdId) {
    const hold = this._requiredHold(holdId);
    hold.cancel();
    return hold;
  }

  _activeHoldFor(flightInstanceId, seatId, now = this.clock()) {
    return [...this.holds.values()].find(
      (hold) =>
        hold.flightInstanceId === flightInstanceId &&
        hold.seatIds.includes(seatId) &&
        hold.isActive(now)
    );
  }

  _requiredHold(holdId) {
    const hold = this.getById(holdId);
    if (!hold) throw new Error('seat hold not found');
    return hold;
  }

  _validateSeatCount(seatIds) {
    if (!Array.isArray(seatIds) || seatIds.length < 1 || seatIds.length > MAX_SEATS_PER_BOOKING) {
      throw new Error(`a booking must contain between 1 and ${MAX_SEATS_PER_BOOKING} seats`);
    }
    if (new Set(seatIds).size !== seatIds.length) {
      throw new Error('seatIds cannot contain duplicates');
    }
  }
}

module.exports = { DEFAULT_TTL_MS, MAX_SEATS_PER_BOOKING, InMemorySeatHoldRepository };