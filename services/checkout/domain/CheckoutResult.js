'use strict';

class CheckoutResult {
  /**
   * @param {string|Object} bookingIdOrData
   * @param {Object} [paymentResult]
   * @param {Buffer|null} [ticketPdf]
   * @param {Buffer|null} [invoicePdf]
   * @param {boolean} [emailSent]
   * @param {string|null} [emailError]
   */
  constructor(
    bookingIdOrData,
    paymentResult,
    ticketPdf = null,
    invoicePdf = null,
    emailSent = false,
    emailError = null
  ) {
    let bookingId;
    let payResult;
    let tPdf = ticketPdf;
    let iPdf = invoicePdf;
    let eSent = emailSent;
    let eError = emailError;

    if (
      typeof bookingIdOrData === 'object' &&
      bookingIdOrData !== null &&
      !bookingIdOrData.isApproved
    ) {
      bookingId = bookingIdOrData.bookingId;
      payResult = bookingIdOrData.paymentResult;
      tPdf = bookingIdOrData.ticketPdf !== undefined ? bookingIdOrData.ticketPdf : null;
      iPdf = bookingIdOrData.invoicePdf !== undefined ? bookingIdOrData.invoicePdf : null;
      eSent = bookingIdOrData.emailSent !== undefined ? bookingIdOrData.emailSent : false;
      eError = bookingIdOrData.emailError !== undefined ? bookingIdOrData.emailError : null;
    } else {
      bookingId = bookingIdOrData;
      payResult = paymentResult;
    }

    if (!bookingId || (typeof bookingId === 'string' && bookingId.trim() === '')) {
      throw new Error('bookingId is required');
    }
    if (!payResult) {
      throw new Error('paymentResult is required');
    }

    this.bookingId = typeof bookingId === 'string' ? bookingId.trim() : bookingId;
    this.paymentResult = payResult;
    this.ticketPdf = tPdf || null;
    this.invoicePdf = iPdf || null;
    this.emailSent = Boolean(eSent);
    this.emailError = eError || null;

    Object.freeze(this);
  }

  /**
   * Factory method for successful checkout before email dispatch.
   * @param {string} bookingId
   * @param {Object} paymentResult
   * @param {Buffer} ticketPdf
   * @param {Buffer} invoicePdf
   * @returns {CheckoutResult}
   */
  static success(bookingId, paymentResult, ticketPdf, invoicePdf) {
    return new CheckoutResult(bookingId, paymentResult, ticketPdf, invoicePdf, false, null);
  }

  /**
   * Factory method for failed payment checkout.
   * @param {string} bookingId
   * @param {Object} paymentResult
   * @returns {CheckoutResult}
   */
  static paymentFailed(bookingId, paymentResult) {
    return new CheckoutResult(bookingId, paymentResult, null, null, false, null);
  }

  /**
   * Creates a new CheckoutResult copy with email result attached.
   * @param {CheckoutResult} checkoutResult
   * @param {boolean} emailSent
   * @param {string|null} [emailError]
   * @returns {CheckoutResult}
   */
  static withEmailResult(checkoutResult, emailSent, emailError = null) {
    if (!checkoutResult) {
      throw new Error('checkoutResult is required');
    }

    return new CheckoutResult(
      checkoutResult.bookingId,
      checkoutResult.paymentResult,
      checkoutResult.ticketPdf,
      checkoutResult.invoicePdf,
      emailSent,
      emailError
    );
  }

  /**
   * Checks whether payment was approved.
   * @returns {boolean}
   */
  isPaymentApproved() {
    return Boolean(
      this.paymentResult &&
        typeof this.paymentResult.isApproved === 'function' &&
        this.paymentResult.isApproved()
    );
  }
}

module.exports = CheckoutResult;
