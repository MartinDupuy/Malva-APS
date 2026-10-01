const StripePaymentGateway = require('../../services/payments/adapters/StripePaymentGateway');
const Money = require('../../services/payments/domain/Money');

describe('StripePaymentGateway', () => {
  let gateway;

  beforeEach(() => {
    gateway = new StripePaymentGateway('fake_api_key');
  });

  test('should return APPROVED result for successful charge', async () => {
    const request = {
      amount: new Money(1000, 'USD'),
      creditCardToken: 'tok_visa',
      idempotencyKey: 'idemp-1'
    };

    const result = await gateway.processPayment(request);

    expect(result.isApproved()).toBe(true);
    expect(result.transactionId).toBe('ch_123');
  });

  test('should return REJECTED result for declined card', async () => {
    const request = {
      amount: new Money(1000, 'USD'),
      creditCardToken: 'tok_chargeDeclined',
      idempotencyKey: 'idemp-2'
    };

    const result = await gateway.processPayment(request);

    expect(result.isRejected()).toBe(true);
    expect(result.message).toBe('Your card was declined.');
  });

  test('should return TRANSIENT_ERROR result for network error', async () => {
    const request = {
      amount: new Money(1000, 'USD'),
      creditCardToken: 'tok_networkError',
      idempotencyKey: 'idemp-3'
    };

    const result = await gateway.processPayment(request);

    expect(result.isTransientError()).toBe(true);
    expect(result.message).toBe('Network error communicating with Stripe.');
  });
});
