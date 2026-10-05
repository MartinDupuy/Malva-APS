const PaymentGateway = require('../domain/PaymentGateway');
const PaymentResult = require('../domain/PaymentResult');
const RetryPolicy = require('../domain/RetryPolicy');

class ResilientPaymentGateway extends PaymentGateway {
  /**
   * @param {PaymentGateway} primaryGateway
   * @param {PaymentGateway} fallbackGateway
   * @param {RetryPolicy} retryPolicy
   */
  constructor(primaryGateway, fallbackGateway, retryPolicy) {
    super();
    this.primaryGateway = primaryGateway;
    this.fallbackGateway = fallbackGateway;
    this.retryPolicy = retryPolicy || new RetryPolicy(3, 100);
    this.circuitOpen = false;
    this.consecutiveFailures = 0;
    this.failureThreshold = 5;
    this.resetTimeoutMs = 60000; // 1 minute
    this.lastFailureTime = null;
  }

  async processPayment(request) {
    this._checkCircuitBreaker();

    if (this.circuitOpen) {
      console.warn('Circuit is open, routing directly to fallback gateway.');
      return this._useFallback(request);
    }

    try {
      // Use retry policy on the primary gateway
      const result = await this.retryPolicy.execute(() => this.primaryGateway.processPayment(request));

      if (result.isTransientError()) {
        // Retry policy exhausted all attempts and returned a transient error
        return this._handlePrimaryFailure(request, result);
      }

      // Success or business rejection (not a technical failure)
      this._resetCircuitBreaker();
      return result;

    } catch (error) {
      // Retry policy exhausted and threw an error
      return this._handlePrimaryFailure(request, error);
    }
  }

  async _handlePrimaryFailure(request, errorOrResult) {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    console.error(`Primary gateway failed. Consecutive failures: ${this.consecutiveFailures}`);

    if (this.consecutiveFailures >= this.failureThreshold) {
      console.error('Failure threshold reached. Opening circuit.');
      this.circuitOpen = true;
    }

    console.log('Failing over to fallback gateway.');
    return this._useFallback(request);
  }

  async _useFallback(request) {
    try {
      // For simplicity, we don't apply the full retry policy on the fallback here,
      // but in a real scenario we might want a simple retry for the fallback as well.
      return await this.fallbackGateway.processPayment(request);
    } catch (error) {
      throw new Error(`Fallback failed as well: ${error.message}`);
    }
  }

  _checkCircuitBreaker() {
    if (this.circuitOpen && this.lastFailureTime) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        console.log('Circuit breaker reset timeout reached. Half-opening circuit.');
        this.circuitOpen = false;
        // In a true half-open state, we'd allow one request through and if it fails, immediately open again.
        // For this basic implementation, we just reset the count.
        this.consecutiveFailures = 0;
      }
    }
  }

  _resetCircuitBreaker() {
    this.circuitOpen = false;
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
  }
}

module.exports = ResilientPaymentGateway;
