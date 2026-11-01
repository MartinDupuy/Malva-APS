const FlightInstance = require('../../flights/domain/flight-instance');

const CABIN_CLASSES = ['economy', 'firstClass'];
const MAX_RANGE_DAYS = 366;
const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

class GetOccupancyReport {
  constructor({ flightRepository, bookingRepository, seatFactory }) {
    this.flightRepository = flightRepository;
    this.bookingRepository = bookingRepository;
    this.seatFactory = seatFactory;
  }

  async execute({ from, to, flightId = null, cabinClass = 'all' } = {}) {
    const range = this._validateRange(from, to);
    this._validateCabinClass(cabinClass);

    const flights = await this.flightRepository.findAll();
    const rows = [];

    for (const flight of flights) {
      if (flight.status === 'CANCELLED' || (flightId && flight.id !== flightId)) continue;

      const dates = this._operatingDates(flight, range.from, range.to);
      for (const date of dates) {
        rows.push(await this._buildRow(flight, date, cabinClass));
      }
    }

    return {
      filters: { from, to, flightId, cabinClass },
      rows,
      totals: this._aggregate(rows, cabinClass)
    };
  }

  async _buildRow(flight, date, cabinClass) {
    const instanceId = new FlightInstance(flight, date).id;
    this.seatFactory.ensureForFlight(flight, instanceId);
    const seats = this.seatFactory.seatsByFlightInstance.get(instanceId) || [];
    const seatById = new Map(seats.map((seat) => [seat.id, seat]));
    const occupiedSeatIds = new Set();
    const bookings = await this.bookingRepository.findByFlightInstanceId(instanceId);

    for (const booking of bookings) {
      for (const passenger of booking.passengers) {
        const seat = seatById.get(passenger.seatId);
        if (seat && (cabinClass === 'all' || seat.cabinClass === cabinClass)) {
          occupiedSeatIds.add(seat.id);
        }
      }
    }

    const classes = {};
    for (const currentClass of CABIN_CLASSES) {
      if (cabinClass !== 'all' && cabinClass !== currentClass) continue;
      const capacity = flight.capacity[currentClass];
      const occupied = [...occupiedSeatIds]
        .map((seatId) => seatById.get(seatId))
        .filter((seat) => seat.cabinClass === currentClass).length;
      classes[currentClass] = this._metrics(capacity, occupied);
    }

    const total = Object.values(classes).reduce((result, metrics) => ({
      capacity: result.capacity + metrics.capacity,
      occupied: result.occupied + metrics.occupied,
      available: result.available + metrics.available
    }), { capacity: 0, occupied: 0, available: 0 });

    return {
      flightId: flight.id,
      flightNumber: flight.flightNumber,
      date,
      classes,
      total: {
        ...total,
        occupancyPercentage: this._percentage(total.capacity, total.occupied)
      }
    };
  }

  _aggregate(rows, cabinClass) {
    const classes = {};
    const classNames = cabinClass === 'all' ? CABIN_CLASSES : [cabinClass];
    for (const currentClass of classNames) {
      const metrics = rows.reduce((result, row) => ({
        capacity: result.capacity + row.classes[currentClass].capacity,
        occupied: result.occupied + row.classes[currentClass].occupied,
        available: result.available + row.classes[currentClass].available
      }), { capacity: 0, occupied: 0, available: 0 });
      classes[currentClass] = {
        ...metrics,
        occupancyPercentage: this._percentage(metrics.capacity, metrics.occupied)
      };
    }

    const total = Object.values(classes).reduce((result, metrics) => ({
      capacity: result.capacity + metrics.capacity,
      occupied: result.occupied + metrics.occupied,
      available: result.available + metrics.available
    }), { capacity: 0, occupied: 0, available: 0 });

    return {
      classes,
      total: {
        ...total,
        occupancyPercentage: this._percentage(total.capacity, total.occupied)
      }
    };
  }

  _operatingDates(flight, from, to) {
    const start = this._maxDate(from, this._dateValue(flight.availabilityPeriod.startDate));
    const end = this._minDate(to, this._dateValue(flight.availabilityPeriod.endDate));
    const dates = [];
    for (let cursor = start; cursor <= end; cursor = this._nextDate(cursor)) {
      const dayCode = DAY_CODES[new Date(`${cursor}T00:00:00Z`).getUTCDay()];
      if (flight.operatingDays.includes(dayCode)) dates.push(cursor);
    }
    return dates;
  }

  _validateRange(from, to) {
    this._validateDate(from, 'from');
    this._validateDate(to, 'to');
    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T00:00:00Z`);
    const days = Math.floor((toDate - fromDate) / 86400000) + 1;
    if (from > to) throw new Error('from must be before or equal to to');
    if (days > MAX_RANGE_DAYS) throw new Error(`date range cannot exceed ${MAX_RANGE_DAYS} days`);
    return { from, to };
  }

  _validateDate(value, field) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`${field} must use YYYY-MM-DD format`);
    }
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new Error(`${field} must be a real calendar date`);
    }
  }

  _validateCabinClass(cabinClass) {
    if (cabinClass !== 'all' && !CABIN_CLASSES.includes(cabinClass)) {
      throw new Error('cabinClass must be all, economy or firstClass');
    }
  }

  _metrics(capacity, occupied) {
    return {
      capacity,
      occupied,
      available: Math.max(capacity - occupied, 0),
      occupancyPercentage: this._percentage(capacity, occupied)
    };
  }

  _percentage(capacity, occupied) {
    return capacity === 0 ? 0 : Number(((occupied / capacity) * 100).toFixed(2));
  }

  _dateValue(date) {
    return date.toISOString().slice(0, 10);
  }

  _maxDate(left, right) {
    return left > right ? left : right;
  }

  _minDate(left, right) {
    return left < right ? left : right;
  }

  _nextDate(date) {
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return this._dateValue(next);
  }
}

module.exports = GetOccupancyReport;