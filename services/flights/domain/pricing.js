const Money = require('../../payments/domain/Money');

class Pricing {
  constructor(values = {}, currency = 'USD') {
    this.economy = this._toMoney(values.economy, 'economy', currency);
    this.firstClass = this._toMoney(values.firstClass, 'firstClass', currency);
    Object.freeze(this);
  }

  _toMoney(value, cabinClass, currency) {
    if (value instanceof Money) return value;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(`${cabinClass} price must be a non-negative number`);
    }
    if (!Number.isInteger(value * 100)) {
      throw new Error(`${cabinClass} price cannot have more than two decimals`);
    }
    const amountInCents = Math.round(value * 100);
    if (!Number.isSafeInteger(amountInCents)) {
      throw new Error(`${cabinClass} price is too large or precise`);
    }
    return new Money(amountInCents, currency);
  }

  toJSON() {
    return {
      economy: this.economy.amount / 100,
      firstClass: this.firstClass.amount / 100,
      currency: this.economy.currency
    };
  }
}

module.exports = Pricing;