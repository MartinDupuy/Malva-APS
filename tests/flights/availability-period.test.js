const AvailabilityPeriod = require('../../services/flights/domain/availability-period');

describe('AvailabilityPeriod', () => {
  test('accepts a future period with strict dates', () => {
    const period = new AvailabilityPeriod('2099-01-01', '2099-03-31');

    expect(period.startDate.toISOString()).toBe('2099-01-01T00:00:00.000Z');
    expect(period.endDate.toISOString()).toBe('2099-03-31T00:00:00.000Z');
  });

  test('returns copies of dates', () => {
    const period = new AvailabilityPeriod('2099-01-01', '2099-03-31');
    const startDate = period.startDate;
    startDate.setUTCFullYear(2100);

    expect(period.startDate.toISOString()).toBe('2099-01-01T00:00:00.000Z');
  });

  test.each([
    ['01-01-2099', '2099-03-31', 'formato YYYY-MM-DD'],
    ['2099-02-30', '2099-03-31', 'no existen'],
    ['2099-01-01', '2098-12-31', 'fin debe ser posterior']
  ])('rejects invalid date ranges', (startDate, endDate, message) => {
    expect(() => new AvailabilityPeriod(startDate, endDate)).toThrow(message);
  });
});