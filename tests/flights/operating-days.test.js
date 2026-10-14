const OperatingDays = require('../../services/flights/domain/operating-days');

describe('OperatingDays', () => {
  test('accepts the seven valid weekday codes', () => {
    const operatingDays = new OperatingDays(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

    expect(operatingDays.days).toHaveLength(7);
  });

  test.each([
    [[], 'al menos un día'],
    [['MON', 'MON'], 'duplicados'],
    [['JUPITER'], 'no es un formato válido']
  ])('rejects invalid day lists', (days, message) => {
    expect(() => new OperatingDays(days)).toThrow(message);
  });
});