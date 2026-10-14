'use strict';

const CheckoutResult = require('../../services/checkout/domain/CheckoutResult');
const PaymentResult = require('../../services/payments/domain/PaymentResult');

describe('CheckoutResult Value Object', () => {
  const sampleTicketPdf = Buffer.from('%PDF-ticket');
  const sampleInvoicePdf = Buffer.from('%PDF-invoice');

  describe('Static Factory success()', () => {
    test('should create a successful checkout result with ticket and invoice PDFs, email pending', () => {
      const paymentResult = PaymentResult.approved('tx-12345');
      const result = CheckoutResult.success(
        'BK-999',
        paymentResult,
        sampleTicketPdf,
        sampleInvoicePdf
      );

      expect(result.bookingId).toBe('BK-999');
      expect(result.paymentResult).toBe(paymentResult);
      expect(result.ticketPdf).toBe(sampleTicketPdf);
      expect(result.invoicePdf).toBe(sampleInvoicePdf);
      expect(result.emailSent).toBe(false);
      expect(result.emailError).toBeNull();
      expect(result.isPaymentApproved()).toBe(true);
    });
  });

  describe('Static Factory paymentFailed()', () => {
    test('should create a failed payment result with null PDFs and no email', () => {
      const paymentResult = PaymentResult.rejected('Insufficient funds');
      const result = CheckoutResult.paymentFailed('BK-888', paymentResult);

      expect(result.bookingId).toBe('BK-888');
      expect(result.paymentResult).toBe(paymentResult);
      expect(result.ticketPdf).toBeNull();
      expect(result.invoicePdf).toBeNull();
      expect(result.emailSent).toBe(false);
      expect(result.emailError).toBeNull();
      expect(result.isPaymentApproved()).toBe(false);
    });
  });

  describe('Static Factory withEmailResult()', () => {
    test('should return a new instance with updated email status without mutating the original', () => {
      const paymentResult = PaymentResult.approved('tx-777');
      const original = CheckoutResult.success(
        'BK-777',
        paymentResult,
        sampleTicketPdf,
        sampleInvoicePdf
      );

      const withSuccessEmail = CheckoutResult.withEmailResult(original, true, null);

      expect(withSuccessEmail).not.toBe(original);
      expect(withSuccessEmail.emailSent).toBe(true);
      expect(withSuccessEmail.emailError).toBeNull();
      expect(withSuccessEmail.bookingId).toBe('BK-777');
      expect(withSuccessEmail.ticketPdf).toBe(sampleTicketPdf);
      expect(withSuccessEmail.invoicePdf).toBe(sampleInvoicePdf);

      // Verify original was not mutated
      expect(original.emailSent).toBe(false);
      expect(original.emailError).toBeNull();
    });

    test('should return a new instance with emailError if email sending failed', () => {
      const paymentResult = PaymentResult.approved('tx-555');
      const original = CheckoutResult.success(
        'BK-555',
        paymentResult,
        sampleTicketPdf,
        sampleInvoicePdf
      );

      const withFailedEmail = CheckoutResult.withEmailResult(
        original,
        false,
        'SMTP connection error'
      );

      expect(withFailedEmail.emailSent).toBe(false);
      expect(withFailedEmail.emailError).toBe('SMTP connection error');
    });

    test('should throw error if checkoutResult is not provided', () => {
      expect(() => CheckoutResult.withEmailResult(null, true)).toThrow(
        'checkoutResult is required'
      );
    });
  });

  describe('Validation', () => {
    test('should throw error when bookingId is missing or empty', () => {
      const paymentResult = PaymentResult.approved('tx-1');
      expect(() => new CheckoutResult('', paymentResult)).toThrow('bookingId is required');
      expect(() => new CheckoutResult(null, paymentResult)).toThrow('bookingId is required');
    });

    test('should throw error when paymentResult is missing', () => {
      expect(() => new CheckoutResult('BK-100', null)).toThrow('paymentResult is required');
    });

    test('should support options object construction', () => {
      const paymentResult = PaymentResult.approved('tx-2');
      const result = new CheckoutResult({
        bookingId: 'BK-OBJ',
        paymentResult,
        ticketPdf: sampleTicketPdf,
        invoicePdf: sampleInvoicePdf,
        emailSent: true,
        emailError: null,
      });

      expect(result.bookingId).toBe('BK-OBJ');
      expect(result.emailSent).toBe(true);
    });
  });

  describe('Immutability', () => {
    test('should be frozen and throw TypeError when attempting modification', () => {
      const paymentResult = PaymentResult.approved('tx-3');
      const result = CheckoutResult.success(
        'BK-IMM',
        paymentResult,
        sampleTicketPdf,
        sampleInvoicePdf
      );

      expect(Object.isFrozen(result)).toBe(true);
      expect(() => {
        result.emailSent = true;
      }).toThrow(TypeError);

      expect(() => {
        result.bookingId = 'BK-HACK';
      }).toThrow(TypeError);
    });
  });
});
