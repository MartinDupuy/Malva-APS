class Money {
  constructor(amount, currency = 'USD') {
    if (!Number.isInteger(amount)) {
      throw new Error('Money amount must be an integer representing the smallest currency unit (e.g., cents).');
    }
    if (amount < 0) {
      throw new Error('Money amount cannot be negative.');
    }
    this._amount = amount;
    this._currency = currency;
    Object.freeze(this);
  }

  get amount() {
    return this._amount;
  }

  get currency() {
    return this._currency;
  }

  add(other) {
    if (this._currency !== other.currency) {
      throw new Error('Cannot add money with different currencies.');
    }
    return new Money(this._amount + other.amount, this._currency);
  }
}

module.exports = Money;
