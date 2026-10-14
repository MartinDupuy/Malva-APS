const VALID_DAYS = new Set(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

class OperatingDays {
	constructor(days) {
		if (!Array.isArray(days) || days.length === 0) {
			throw new Error('Operating days must contain at least one day');
		}
		const uniqueDays = [...new Set(days)];
			if (uniqueDays.some(day => !VALID_DAYS.has(day))) {
				throw new Error('Operating days must use MON, TUE, WED, THU, FRI, SAT or SUN');
		}
			this.values = Object.freeze(uniqueDays);
		Object.freeze(this);
	}

	includes(day) {
		return this.values.includes(day);
	}
}

module.exports = OperatingDays;
