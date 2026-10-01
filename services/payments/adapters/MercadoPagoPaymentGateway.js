const PaymentGateway = require('../domain/PaymentGateway');
const PaymentResult = require('../domain/PaymentResult');
// Mocking the mercadopago SDK for the sandbox adapter

class MercadoPagoPaymentGateway extends PaymentGateway {
  constructor(accessToken = process.env.MP_ACCESS_TOKEN) {
    super();
    this.accessToken = accessToken;
  }

  async processPayment(request) {
    try {
      // Simulating a call to the MercadoPago API
      const response = await this._mockMPPayment(request);
      
      if (response.status === 'approved') {
        return PaymentResult.approved(response.id);
      } else if (response.status === 'rejected') {
        return PaymentResult.rejected(`Payment rejected: ${response.status_detail}`);
      } else {
        return PaymentResult.transientError(`Unexpected status from MP: ${response.status}`);
      }
    } catch (error) {
      if (error.type === 'MPNetworkError' || error.type === 'MPApiError') {
        return PaymentResult.transientError(error.message);
      }
      return PaymentResult.transientError(`Unexpected error: ${error.message}`);
    }
  }

  async _mockMPPayment(request) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (request.creditCardToken === 'tok_mp_approved') {
          resolve({ id: 'mp_456', status: 'approved' });
        } else if (request.creditCardToken === 'tok_mp_rejected') {
          resolve({ id: 'mp_456', status: 'rejected', status_detail: 'cc_rejected_insufficient_amount' });
        } else if (request.creditCardToken === 'tok_mp_networkError') {
          reject({ type: 'MPNetworkError', message: 'Connection timeout' });
        } else {
          // If token comes from fallback scenario (it might be a generic token), we just approve it in sandbox
          resolve({ id: 'mp_fallback_999', status: 'approved' });
        }
      }, 50);
    });
  }
}

module.exports = MercadoPagoPaymentGateway;
