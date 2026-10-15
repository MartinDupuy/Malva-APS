const crypto = require('crypto');

const HOLD_STATUSES = Object.freeze({
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED'
});

class SeatHold {
  constructor({
    id = crypto.randomUUID(),
    bookingId,
    flightInstanceId,
    seatIds,
    expiresAt,
    status = HOLD_STATUSES.ACTIVE
  }) {
    if (typeof bookingId !== 'string' || bookingId.trim() === '') {
      throw new Error('bookingId is required');
    }
    if (typeof flightInstanceId !== 'string' || flightInstanceId.trim() === '') {
      throw new Error('flightInstanceId is required');
    }
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      throw new Error('seatIds must contain at least one seat');
    }
    if (new Set(seatIds).size !== seatIds.length) {
      throw new Error('seatIds cannot contain duplicates');
    }
    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
      throw new Error('expiresAt must be a valid date');
    }
    if (!Object.values(HOLD_STATUSES).includes(status)) {
      throw new Error('status is invalid');
    }

    this.id = id;
    this.bookingId = bookingId.trim();
    this.flightInstanceId = flightInstanceId.trim();
    this.seatIds = Object.freeze([...seatIds]);
    this.expiresAt = new Date(expiresAt.getTime());
    this.status = status;
  }

  isActive(now = new Date()) {
    if (this.status !== HOLD_STATUSES.ACTIVE) return false;
    if (now >= this.expiresAt) {
      this.status = HOLD_STATUSES.EXPIRED;
      return false;
    }
    return true;
  }

  confirm(now = new Date()) {
    if (!this.isActive(now)) {
      throw new Error('seat hold has expired or is no longer active');
    }
    this.status = HOLD_STATUSES.CONFIRMED;
  }

  cancel() {
    if (this.status === HOLD_STATUSES.ACTIVE) {
      this.status = HOLD_STATUSES.CANCELLED;
    }
  }
}

module.exports = { HOLD_STATUSES, SeatHold };