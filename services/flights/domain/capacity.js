class Capacity {
	constructor(economy, firstClass) {
		this.validate(economy, 'Economy');
		this.validate(firstClass, 'Primera Clase');
		this.economy = economy;
		this.firstClass = firstClass;
		this.total = economy + firstClass;
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

	hasSeatsFor(passengers) {
		return Number.isInteger(passengers) && passengers > 0
			&& this.economy >= passengers;
	}
}

module.exports = Capacity;
