const Money = require('../../services/payments/domain/Money');
const Pricing = require('../../services/flights/domain/pricing');

describe('Pricing', () => {
  test('stores prices as shared Money values in cents', () => {
    const pricing = new Pricing({ economy: 85000.50, firstClass: 180000 }, 'ARS');

    expect(pricing.economy).toBeInstanceOf(Money);
    expect(pricing.economy.amount).toBe(8500050);
    expect(pricing.economy.currency).toBe('ARS');
    expect(pricing.toJSON()).toEqual({ economy: 85000.5, firstClass: 180000, currency: 'ARS' });
  });

  test('rejects prices with more than two decimals', () => {
    expect(() => new Pricing({ economy: 10.001, firstClass: 20 })).toThrow(/more than two decimals/);
  });
});