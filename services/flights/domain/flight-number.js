class FlightNumber {
	constructor(value) {
		if (typeof value !== 'string' || !/^[A-Z0-9-]{2,10}$/.test(value)) {
			throw new Error('Flight number must contain 2 to 10 uppercase letters, numbers or hyphens');
		}
		this.value = value;
		Object.freeze(this);
	}
}

module.exports = FlightNumber;
