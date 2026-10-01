const Money = require('../../services/payments/domain/Money');

describe('Money Value Object', () => {
  test('should create a valid money object', () => {
    const money = new Money(1000, 'USD');
    expect(money.amount).toBe(1000);
    expect(money.currency).toBe('USD');
  });

  test('should default currency to USD', () => {
    const money = new Money(500);
    expect(money.currency).toBe('USD');
  });

  test('should throw error if amount is negative', () => {
    expect(() => new Money(-100)).toThrow('Money amount cannot be negative.');
  });

  test('should throw error if amount is not an integer', () => {
    expect(() => new Money(10.5)).toThrow('Money amount must be an integer representing the smallest currency unit (e.g., cents).');
  });

  test('should be immutable', () => {
    const money = new Money(100);
    expect(() => { money._amount = 200; }).toThrow();
  });

  test('should add money of same currency', () => {
    const m1 = new Money(100, 'EUR');
    const m2 = new Money(200, 'EUR');
    const m3 = m1.add(m2);
    expect(m3.amount).toBe(300);
    expect(m3.currency).toBe('EUR');
  });

  test('should throw error when adding different currencies', () => {
    const m1 = new Money(100, 'USD');
    const m2 = new Money(100, 'EUR');
    expect(() => m1.add(m2)).toThrow('Cannot add money with different currencies.');
  });
});
