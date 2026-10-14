const crypto = require('crypto');
const FlightNumber = require('./flight-number');
const Capacity = require('./capacity');
const OperatingDays = require('./operating-days');
const AvailabilityPeriod = require('./availability-period');
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
		this.operatingDays = new OperatingDays(data.operatingDays).days;
		this.availabilityPeriod = new AvailabilityPeriod(
			data.availabilityPeriod?.startDate,
			data.availabilityPeriod?.endDate
		);
		this.capacity = new Capacity(data.capacity?.economy, data.capacity?.firstClass);
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
