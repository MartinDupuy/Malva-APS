class Pricing {
  constructor(values = {}) {
    this.economy = this._validate(values.economy, 'economy');
    this.firstClass = this._validate(values.firstClass, 'firstClass');
    Object.freeze(this);
  }

  _validate(value, cabinClass) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(`${cabinClass} price must be a non-negative number`);
    }
    return value;
  }
}

module.exports = Pricing;