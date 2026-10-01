const PaymentGateway = require('../domain/PaymentGateway');
const PaymentResult = require('../domain/PaymentResult');
// Mocking the stripe library for the sandbox adapter
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripePaymentGateway extends PaymentGateway {
  constructor(apiKey = process.env.STRIPE_SECRET_KEY) {
    super();
    this.apiKey = apiKey;
  }

  async processPayment(request) {
    try {
      // Simulating a call to the Stripe API
      const response = await this._mockStripeCharge(request);
      
      if (response.status === 'succeeded') {
        return PaymentResult.approved(response.id);
      } else {
        return PaymentResult.rejected(`Payment failed with status: ${response.status}`);
      }
    } catch (error) {
      if (error.type === 'StripeCardError') {
        return PaymentResult.rejected(error.message);
      }
      if (error.type === 'StripeConnectionError' || error.type === 'StripeAPIError') {
        return PaymentResult.transientError(error.message);
      }
      // Any other unexpected error is considered transient for retry/fallback purposes
      return PaymentResult.transientError(`Unexpected error: ${error.message}`);
    }
  }

  // Mock method to simulate Stripe API behavior based on token
  async _mockStripeCharge(request) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (request.creditCardToken === 'tok_visa') {
          resolve({ id: 'ch_123', status: 'succeeded' });
        } else if (request.creditCardToken === 'tok_chargeDeclined') {
          reject({ type: 'StripeCardError', message: 'Your card was declined.' });
        } else if (request.creditCardToken === 'tok_networkError') {
          reject({ type: 'StripeConnectionError', message: 'Network error communicating with Stripe.' });
        } else {
          resolve({ id: 'ch_999', status: 'succeeded' });
        }
      }, 50);
    });
  }
}

module.exports = StripePaymentGateway;
