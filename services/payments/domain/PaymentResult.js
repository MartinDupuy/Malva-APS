class PaymentResult {
  constructor(status, transactionId, message) {
    if (!['APPROVED', 'REJECTED', 'TRANSIENT_ERROR'].includes(status)) {
      throw new Error('Invalid payment status');
    }
    this.status = status;
    this.transactionId = transactionId;
    this.message = message;
    Object.freeze(this);
  }

  static approved(transactionId) {
    return new PaymentResult('APPROVED', transactionId, 'Payment approved');
  }

  static rejected(message) {
    return new PaymentResult('REJECTED', null, message);
  }

  static transientError(message) {
    return new PaymentResult('TRANSIENT_ERROR', null, message);
  }

  isApproved() {
    return this.status === 'APPROVED';
  }

  isRejected() {
    return this.status === 'REJECTED';
  }

  isTransientError() {
    return this.status === 'TRANSIENT_ERROR';
  }
}

module.exports = PaymentResult;
