const OperatingDays = require('../../services/flights/domain/operating-days');

describe('OperatingDays', () => {
  test('accepts the seven valid weekday codes', () => {
    const operatingDays = new OperatingDays(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

    expect(operatingDays.days).toHaveLength(7);
  });

  test('copies and freezes the input days', () => {
    const input = ['MON', 'WED'];
    const operatingDays = new OperatingDays(input);
    input.push('FRI');

    expect(operatingDays.days).toEqual(['MON', 'WED']);
    expect(() => operatingDays.days.push('FRI')).toThrow();
  });

  test.each([
    [[], 'al menos un día'],
    [['MON', 'MON'], 'duplicados'],
    [['JUPITER'], 'no es un formato válido']
  ])('rejects invalid day lists', (days, message) => {
    expect(() => new OperatingDays(days)).toThrow(message);
  });
});