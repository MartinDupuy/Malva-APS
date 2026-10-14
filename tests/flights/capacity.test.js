const Capacity = require('../../services/flights/domain/capacity');

describe('Capacity', () => {
  test('stores class capacities and total', () => {
    const capacity = new Capacity(150, 20);

    expect(capacity.economy).toBe(150);
    expect(capacity.firstClass).toBe(20);
    expect(capacity.total).toBe(170);
  });

  test.each([
    [null, 20, 'Economy', 'debe ser un número'],
    [10.5, 20, 'Economy', 'no puede tener decimales'],
    [-1, 20, 'Economy', 'no puede ser negativa'],
    [150, -1, 'Primera Clase', 'no puede ser negativa']
  ])('rejects invalid capacity values', (economy, firstClass, className, message) => {
    expect(() => new Capacity(economy, firstClass)).toThrow(`${className} ${message}`);
  });
});