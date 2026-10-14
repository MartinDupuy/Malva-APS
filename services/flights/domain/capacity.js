class Capacity {
	constructor(economy, firstClass) {
		this.validate(economy, 'Economy');
		this.validate(firstClass, 'Primera Clase');
		this.economy = economy;
		this.firstClass = firstClass;
		this.total = economy + firstClass;
		Object.freeze(this);
	}

	validate(value, className) {
		if (typeof value !== 'number' || Number.isNaN(value)) {
			throw new Error(`La capacidad de ${className} debe ser un número.`);
		}
		if (!Number.isInteger(value)) {
			throw new Error(`La capacidad de ${className} no puede tener decimales.`);
		}
		if (value < 0) {
			throw new Error(`La capacidad de ${className} no puede ser negativa.`);
		}
	}

	hasSeatsFor(passengers, cabinClass = 'economy') {
		if (!Number.isInteger(passengers) || passengers < 1) return false;
		if (cabinClass === 'firstClass') return this.firstClass >= passengers;
		if (cabinClass === 'all') return this.economy >= passengers || this.firstClass >= passengers;
		return this.economy >= passengers;
	}
}

module.exports = Capacity;
