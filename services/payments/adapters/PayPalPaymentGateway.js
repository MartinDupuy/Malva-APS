const PaymentGateway = require('../domain/PaymentGateway');
const PaymentResult = require('../domain/PaymentResult');

class PayPalPaymentGateway extends PaymentGateway {
  constructor(apiKey = 'paypal_mock_key') {
    super();
    this.apiKey = apiKey;
  }

  async processPayment(request) {
    try {
      const response = await this._mockPayPalCharge(request);
      if (response.status === 'COMPLETED') {
        return PaymentResult.approved(response.id);
      } else {
        return PaymentResult.rejected(`PayPal failed with status: ${response.status}`);
      }
    } catch (error) {
      return PaymentResult.transientError(`PayPal transient error: ${error.message}`);
    }
  }

  async _mockPayPalCharge(request) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: 'pp_mock_123', status: 'COMPLETED' });
      }, 50);
    });
  }
}

module.exports = PayPalPaymentGateway;
