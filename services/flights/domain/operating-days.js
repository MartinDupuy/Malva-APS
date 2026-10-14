const VALID_DAYS = new Set([1, 2, 3, 4, 5, 6, 7]);

class OperatingDays {
	constructor(days) {
		if (!Array.isArray(days) || days.length === 0) {
			throw new Error('Operating days must contain at least one day');
		}
		const uniqueDays = [...new Set(days)];
		if (uniqueDays.some(day => !VALID_DAYS.has(day))) {
			throw new Error('Operating days must use numbers from 1 to 7');
		}
		this.values = Object.freeze(uniqueDays.sort((first, second) => first - second));
		Object.freeze(this);
	}

	includes(day) {
		return this.values.includes(day);
	}
}

module.exports = OperatingDays;
