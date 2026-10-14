class AvailabilityPeriod {
  constructor(startDateStr, endDateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(startDateStr) || !regex.test(endDateStr)) {
      throw new Error('Las fechas deben tener el formato YYYY-MM-DD.');
    }
    this.startDate = this._parseDate(startDateStr);
    this.endDate = this._parseDate(endDateStr);
    this.validateDates();
  }

  _parseDate(dateString) {
    const date = new Date(`${dateString}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateString) {
      throw new Error('Las fechas provistas no existen en el calendario.');
    }
    return date;
  }

  validateDates() {
    const today = new Date();
    const todayMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (this.startDate.getTime() < todayMidnight) {
      throw new Error('La fecha de inicio no puede estar en el pasado.');
    }
    if (this.endDate.getTime() <= this.startDate.getTime()) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio.');
    }
  }
}

module.exports = AvailabilityPeriod;