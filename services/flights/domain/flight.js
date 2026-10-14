const crypto = require('crypto');
const FlightNumber = require('./flight-number');
const Capacity = require('./capacity');
const OperatingDays = require('./operating-days');

class Flight {
	constructor(data) {
		this.id = data.id || crypto.randomUUID();
		this.flightNumber = new FlightNumber(data.flightNumber).value;
		this.origin = this._requiredText(data.origin, 'origin');
		this.destination = this._requiredText(data.destination, 'destination');
		this._validateRoute();
		this.departureTime = this._requiredText(data.departureTime, 'departureTime');
		this.arrivalTime = this._requiredText(data.arrivalTime, 'arrivalTime');
		this.operatingDays = new OperatingDays(data.operatingDays).values;
		this.startDate = this._date(data.startDate, 'startDate');
		this.endDate = this._date(data.endDate, 'endDate');
		this._validateDateRange();
		this.capacity = new Capacity(data.capacity);
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
		if (this.origin.toUpperCase() === this.destination.toUpperCase()) {
			throw new Error('origin and destination must be different');
		}
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
		if (this.startDate > this.endDate) {
			throw new Error('startDate must be before or equal to endDate');
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
