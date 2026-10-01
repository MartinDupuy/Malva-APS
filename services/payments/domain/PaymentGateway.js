/**
 * PaymentGateway Interface (Port)
 * 
 * In JS we don't have strict interfaces, so we define a class with methods that throw.
 * Adapters must implement this port.
 */
class PaymentGateway {
  /**
   * Processes a payment request.
   * @param {Object} request - The payment request details.
   * @param {Money} request.amount - The amount to charge.
   * @param {String} request.creditCardToken - The tokenized credit card.
   * @param {String} request.idempotencyKey - Unique key for this transaction attempt.
   * @returns {Promise<PaymentResult>}
   */
  async processPayment(request) {
    throw new Error('Method not implemented.');
  }
}

module.exports = PaymentGateway;
