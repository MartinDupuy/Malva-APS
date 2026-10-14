const crypto = require('crypto');
const FlightNumber = require('./flight-number');
const Capacity = require('./capacity');
const OperatingDays = require('./operating-days');
const Pricing = require('./pricing');

class Flight {
	constructor(data) {
		this.id = data.id || crypto.randomUUID();
		this.flightNumber = new FlightNumber(data.flightNumber).value;
		this.originAirport = this._requiredText(data.originAirport, 'originAirport');
		this.destinationAirport = this._requiredText(data.destinationAirport, 'destinationAirport');
		this._validateRoute();
		this.departureTime = this._requiredText(data.departureTime, 'departureTime');
		this.arrivalTime = this._requiredText(data.arrivalTime, 'arrivalTime');
		this.operatingDays = new OperatingDays(data.operatingDays).values;
		this.availabilityPeriod = this._availabilityPeriod(data.availabilityPeriod);
		this._validateDateRange();
		this.capacity = new Capacity(data.capacity);
		this.pricing = new Pricing(data.pricing);
		this.status = data.status || 'ACTIVE';
		this._validateStatus();
	}

	_requiredText(value, field) {
		if (typeof value !== 'string' || value.trim() === '') {
			throw new Error(`${field} is required`);
		}
		return value.trim();
	}

	_validateRoute() {
		if (this.originAirport.toUpperCase() === this.destinationAirport.toUpperCase()) {
			throw new Error('originAirport and destinationAirport must be different');
		}
	}

	_availabilityPeriod(period = {}) {
		return {
			startDate: this._date(period.startDate, 'availabilityPeriod.startDate'),
			endDate: this._date(period.endDate, 'availabilityPeriod.endDate')
		};
	}

	_date(value, field) {
		if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			throw new Error(`${field} must use YYYY-MM-DD format`);
		}
		const parsed = new Date(`${value}T00:00:00Z`);
		if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
			throw new Error(`${field} must be a valid date`);
		}
		return value;
	}

	_validateDateRange() {
		if (this.availabilityPeriod.startDate > this.availabilityPeriod.endDate) {
			throw new Error('availabilityPeriod.startDate must be before or equal to endDate');
		}
	}

	_validateStatus() {
		if (!['ACTIVE', 'CANCELLED'].includes(this.status)) {
			throw new Error('status must be ACTIVE or CANCELLED');
		}
	}

	cancel() {
		this.status = 'CANCELLED';
	}
}

module.exports = Flight;
