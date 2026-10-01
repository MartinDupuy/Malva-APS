class RetryPolicy {
  /**
   * @param {number} maxAttempts Maximum number of attempts (including the first one)
   * @param {number} baseDelayMs Base delay in milliseconds
   */
  constructor(maxAttempts = 3, baseDelayMs = 1000) {
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
  }

  /**
   * Executes a given operation with retries.
   * Only retries if the error is considered transient by the provided predicate,
   * or if the result itself is a PaymentResult indicating a transient error.
   * 
   * @param {Function} operation Function that returns a Promise
   * @returns {Promise<any>}
   */
  async execute(operation) {
    let attempt = 1;
    while (attempt <= this.maxAttempts) {
      try {
        const result = await operation();
        // If result is a PaymentResult and it's a transient error, we throw to trigger retry
        if (result && typeof result.isTransientError === 'function' && result.isTransientError()) {
          if (attempt === this.maxAttempts) {
            return result; // return the transient error if we're out of attempts
          }
          throw new Error('TRANSIENT_PAYMENT_ERROR');
        }
        return result;
      } catch (error) {
        if (attempt >= this.maxAttempts) {
          throw error;
        }
        
        // Wait with exponential backoff
        const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
  }
}

module.exports = RetryPolicy;
