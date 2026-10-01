const crypto = require('crypto');

class PaymentRequest {
  /**
   * @param {Money} amount 
   * @param {String} creditCardToken 
   * @param {String} bookingId 
   * @param {String} idempotencyKey (Optional) Auto-generated if not provided
   */
  constructor(amount, creditCardToken, bookingId, idempotencyKey = null) {
    if (!amount || !creditCardToken || !bookingId) {
      throw new Error('amount, creditCardToken and bookingId are required');
    }
    this.amount = amount;
    this.creditCardToken = creditCardToken;
    this.bookingId = bookingId;
    this.idempotencyKey = idempotencyKey || crypto.randomUUID();
    Object.freeze(this);
  }
}

module.exports = PaymentRequest;
