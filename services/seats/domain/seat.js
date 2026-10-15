const crypto = require('crypto');
const { normalizeCabinClass } = require('./cabin-class');

class Seat {
  constructor({ id = crypto.randomUUID(), number, cabinClass }) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('seat id is required');
    }
    if (typeof number !== 'string' || number.trim() === '') {
      throw new Error('seat number is required');
    }

    this.id = id.trim();
    this.number = number.trim();
    this.cabinClass = normalizeCabinClass(cabinClass);
    Object.freeze(this);
  }
}

module.exports = Seat;