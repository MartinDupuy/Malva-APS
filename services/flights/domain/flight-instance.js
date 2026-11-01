const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const INSTANCE_SEPARATOR = '::';

class FlightInstance {
  constructor(flight, date) {
    this._validateDate(date);
    if (flight.status !== 'ACTIVE') throw new Error('flight is not active');
    if (date < this._dateValue(flight.availabilityPeriod.startDate)
      || date > this._dateValue(flight.availabilityPeriod.endDate)) {
      throw new Error('flight is outside its availability period');
    }
    const operatingDay = DAY_CODES[new Date(`${date}T00:00:00Z`).getUTCDay()];
    if (!flight.operatingDays.includes(operatingDay)) {
      throw new Error('flight does not operate on the selected date');
    }

    this.flightId = flight.id;
    this.date = date;
    this.id = FlightInstance.createId(flight.id, date);
    Object.freeze(this);
  }

  static createId(flightId, date) {
    if (typeof flightId !== 'string' || flightId.trim() === '') {
      throw new Error('flightId is required');
    }
    FlightInstance.prototype._validateDate(date);
    return `${flightId.trim()}${INSTANCE_SEPARATOR}${date}`;
  }

  static parseId(instanceId) {
    if (typeof instanceId !== 'string' || instanceId.trim() === '') {
      throw new Error('flightInstanceId is required');
    }
    const separatorIndex = instanceId.lastIndexOf(INSTANCE_SEPARATOR);
    if (separatorIndex === -1) return { flightId: instanceId, date: null };

    const flightId = instanceId.slice(0, separatorIndex);
    const date = instanceId.slice(separatorIndex + INSTANCE_SEPARATOR.length);
    if (!flightId) throw new Error('flightInstanceId is invalid');
    FlightInstance.prototype._validateDate(date);
    return { flightId, date };
  }

  _validateDate(date) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('date must use YYYY-MM-DD format');
    }
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new Error('date must be a real calendar date');
    }
  }

  _dateValue(date) {
    return date.toISOString().slice(0, 10);
  }
}

module.exports = FlightInstance;
