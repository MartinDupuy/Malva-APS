const VALID_DAYS = new Set(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

class OperatingDays {
	constructor(daysArray) {
		if (!Array.isArray(daysArray) || daysArray.length === 0) {
			throw new Error('Debe proveer al menos un día de operación válido.');
		}
		const uniqueDays = new Set(daysArray);
		if (uniqueDays.size !== daysArray.length) {
			throw new Error('La lista de días de operación contiene elementos duplicados.');
		}
		for (const day of daysArray) {
			if (!VALID_DAYS.has(day)) {
				throw new Error(`El día ${day} no es un formato válido. Use MON, TUE, etc.`);
			}
		}
		this.days = Object.freeze([...daysArray]);
		Object.freeze(this);
	}

	includes(day) {
		return this.days.includes(day);
	}
}

module.exports = OperatingDays;
