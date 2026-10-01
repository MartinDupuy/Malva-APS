const ResilientPaymentGateway = require('../../services/payments/adapters/ResilientPaymentGateway');
const PaymentResult = require('../../services/payments/domain/PaymentResult');
const RetryPolicy = require('../../services/payments/domain/RetryPolicy');

describe('ResilientPaymentGateway', () => {
  let primaryGateway;
  let fallbackGateway;
  let retryPolicy;
  let resilientGateway;

  beforeEach(() => {
    primaryGateway = {
      processPayment: jest.fn()
    };
    fallbackGateway = {
      processPayment: jest.fn()
    };
    // Fast retry policy for tests
    retryPolicy = new RetryPolicy(3, 1);
    resilientGateway = new ResilientPaymentGateway(primaryGateway, fallbackGateway, retryPolicy);
    // Lower failure threshold for testing
    resilientGateway.failureThreshold = 2;
  });

  test('should use primary if it succeeds', async () => {
    primaryGateway.processPayment.mockResolvedValue(PaymentResult.approved('ch_123'));
    
    const result = await resilientGateway.processPayment({});
    
    expect(result.isApproved()).toBe(true);
    expect(primaryGateway.processPayment).toHaveBeenCalledTimes(1);
    expect(fallbackGateway.processPayment).not.toHaveBeenCalled();
  });

  test('should retry primary on transient error and succeed', async () => {
    primaryGateway.processPayment
      .mockResolvedValueOnce(PaymentResult.transientError('Net error'))
      .mockResolvedValueOnce(PaymentResult.approved('ch_123'));
    
    const result = await resilientGateway.processPayment({});
    
    expect(result.isApproved()).toBe(true);
    expect(primaryGateway.processPayment).toHaveBeenCalledTimes(2);
    expect(fallbackGateway.processPayment).not.toHaveBeenCalled();
  });

  test('should fallback to secondary if primary exhausts retries', async () => {
    primaryGateway.processPayment.mockResolvedValue(PaymentResult.transientError('Net error'));
    fallbackGateway.processPayment.mockResolvedValue(PaymentResult.approved('ch_fallback'));
    
    const result = await resilientGateway.processPayment({});
    
    expect(result.isApproved()).toBe(true);
    expect(result.transactionId).toBe('ch_fallback');
    expect(primaryGateway.processPayment).toHaveBeenCalledTimes(3);
    expect(fallbackGateway.processPayment).toHaveBeenCalledTimes(1);
  });

  test('should open circuit after failure threshold and route directly to fallback', async () => {
    primaryGateway.processPayment.mockResolvedValue(PaymentResult.transientError('Net error'));
    fallbackGateway.processPayment.mockResolvedValue(PaymentResult.approved('ch_fallback'));
    
    // 1st request -> fails 3 times -> circuit open count = 1
    await resilientGateway.processPayment({});
    
    // 2nd request -> fails 3 times -> circuit open count = 2 (Threshold reached)
    await resilientGateway.processPayment({});
    
    expect(resilientGateway.circuitOpen).toBe(true);

    primaryGateway.processPayment.mockClear();
    
    // 3rd request -> circuit is open, routes directly to fallback
    const result = await resilientGateway.processPayment({});
    expect(result.isApproved()).toBe(true);
    expect(primaryGateway.processPayment).not.toHaveBeenCalled();
    expect(fallbackGateway.processPayment).toHaveBeenCalledTimes(3);
  });
});
