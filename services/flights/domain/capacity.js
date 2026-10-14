const CABIN_CLASSES = ['economy', 'firstClass'];

class Capacity {
	constructor(values = {}) {
		this.economy = this._validate(values.economy, 'economy');
		this.firstClass = this._validate(values.firstClass, 'firstClass');
		Object.freeze(this);
	}

	_validate(value, cabinClass) {
		if (!Number.isInteger(value) || value < 0) {
			throw new Error(`${cabinClass} capacity must be a non-negative integer`);
		}
		return value;
	}

	hasSeatsFor(passengers) {
		return Number.isInteger(passengers) && passengers > 0
			&& this.economy >= passengers;
	}
}

module.exports = Capacity;
module.exports.CABIN_CLASSES = CABIN_CLASSES;
