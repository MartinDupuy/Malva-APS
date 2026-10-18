'use strict';

const CheckoutService = require('../../services/checkout/domain/CheckoutService');
const CheckoutRequest = require('../../services/checkout/domain/CheckoutRequest');
const PaymentResult = require('../../services/payments/domain/PaymentResult');
const Money = require('../../services/payments/domain/Money');

describe('CheckoutService Use Case', () => {
  let paymentGatewayMock;
  let ticketGeneratorMock;
  let invoiceGeneratorMock;
  let emailSenderMock;
  let checkoutService;

  const validRequestData = {
    bookingId: 'BK-12345',
    passengerName: 'Lionel Messi',
    passengerEmail: 'lionel.messi@example.com',
    flightNumber: 'MV-10',
    origin: 'EZE',
    destination: 'MIA',
    departureDate: '2026-11-20',
    departureTime: '21:00',
    seatNumber: '10A',
    cabinClass: 'First',
    amount: new Money(150000, 'USD'),
    creditCardToken: 'tok_visa_valid',
  };

  const sampleTicketPdf = Buffer.from('%PDF-ticket-sample');
  const sampleInvoicePdf = Buffer.from('%PDF-invoice-sample');

  beforeEach(() => {
    paymentGatewayMock = {
      processPayment: jest.fn(),
    };
    ticketGeneratorMock = {
      generate: jest.fn(),
    };
    invoiceGeneratorMock = {
      generate: jest.fn(),
    };
    emailSenderMock = {
      send: jest.fn(),
    };

    checkoutService = new CheckoutService(
      paymentGatewayMock,
      ticketGeneratorMock,
      invoiceGeneratorMock,
      emailSenderMock
    );
  });

  describe('Successful checkout flow', () => {
    test('when payment and email succeed, returns success with PDFs and emailSent = true', async () => {
      const paymentResult = PaymentResult.approved('tx_success_001');
      paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);
      ticketGeneratorMock.generate.mockResolvedValueOnce(sampleTicketPdf);
      invoiceGeneratorMock.generate.mockResolvedValueOnce(sampleInvoicePdf);
      emailSenderMock.send.mockResolvedValueOnce({ success: true, messageId: 'msg-999' });

      const request = new CheckoutRequest(validRequestData);
      const result = await checkoutService.processCheckout(request);

      expect(paymentGatewayMock.processPayment).toHaveBeenCalledTimes(1);
      expect(ticketGeneratorMock.generate).toHaveBeenCalledTimes(1);
      expect(invoiceGeneratorMock.generate).toHaveBeenCalledTimes(1);
      expect(emailSenderMock.send).toHaveBeenCalledTimes(1);

      expect(result.isPaymentApproved()).toBe(true);
      expect(result.bookingId).toBe('BK-12345');
      expect(result.paymentResult).toBe(paymentResult);
      expect(result.ticketPdf).toEqual(sampleTicketPdf);
      expect(result.invoicePdf).toEqual(sampleInvoicePdf);
      expect(result.emailSent).toBe(true);
      expect(result.emailError).toBeNull();

      // Verify email was built with both PDFs
      const sentEmail = emailSenderMock.send.mock.calls[0][0];
      expect(sentEmail.to).toBe('lionel.messi@example.com');
      expect(sentEmail.attachments).toHaveLength(2);
      expect(sentEmail.attachments[0].filename).toBe('Pasaje-BK-12345.pdf');
      expect(sentEmail.attachments[0].content).toEqual(sampleTicketPdf);
      expect(sentEmail.attachments[1].filename).toBe('Factura-BK-12345.pdf');
      expect(sentEmail.attachments[1].content).toEqual(sampleInvoicePdf);
    });
  });

  describe('Payment failure scenarios', () => {
    test('when payment is rejected, returns paymentFailed and does not call generators or email sender', async () => {
      const paymentResult = PaymentResult.rejected('Card expired');
      paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);

      const request = new CheckoutRequest(validRequestData);
      const result = await checkoutService.processCheckout(request);

      expect(paymentGatewayMock.processPayment).toHaveBeenCalledTimes(1);
      expect(ticketGeneratorMock.generate).not.toHaveBeenCalled();
      expect(invoiceGeneratorMock.generate).not.toHaveBeenCalled();
      expect(emailSenderMock.send).not.toHaveBeenCalled();

      expect(result.isPaymentApproved()).toBe(false);
      expect(result.bookingId).toBe('BK-12345');
      expect(result.paymentResult.isRejected()).toBe(true);
      expect(result.ticketPdf).toBeNull();
      expect(result.invoicePdf).toBeNull();
      expect(result.emailSent).toBe(false);
    });

    test('when payment gateway returns TRANSIENT_ERROR, returns paymentFailed and preserves error', async () => {
      const paymentResult = PaymentResult.transientError('Gateway timeout');
      paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);

      const request = new CheckoutRequest(validRequestData);
      const result = await checkoutService.processCheckout(request);

      expect(paymentGatewayMock.processPayment).toHaveBeenCalledTimes(1);
      expect(ticketGeneratorMock.generate).not.toHaveBeenCalled();
      expect(invoiceGeneratorMock.generate).not.toHaveBeenCalled();
      expect(emailSenderMock.send).not.toHaveBeenCalled();

      expect(result.isPaymentApproved()).toBe(false);
      expect(result.paymentResult.isTransientError()).toBe(true);
      expect(result.paymentResult.message).toBe('Gateway timeout');
    });
  });

  describe('Email failure scenario', () => {
    test('when payment succeeds but email fails, does not revert payment and returns emailSent=false with emailError', async () => {
      const paymentResult = PaymentResult.approved('tx_success_002');
      paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);
      ticketGeneratorMock.generate.mockResolvedValueOnce(sampleTicketPdf);
      invoiceGeneratorMock.generate.mockResolvedValueOnce(sampleInvoicePdf);
      emailSenderMock.send.mockRejectedValueOnce(new Error('SMTP service unavailable'));

      const request = new CheckoutRequest(validRequestData);
      const result = await checkoutService.processCheckout(request);

      expect(result.isPaymentApproved()).toBe(true);
      expect(result.ticketPdf).toEqual(sampleTicketPdf);
      expect(result.invoicePdf).toEqual(sampleInvoicePdf);
      expect(result.emailSent).toBe(false);
      expect(result.emailError).toBe('SMTP service unavailable');
    });
  });

  describe('Constructor validation and options object', () => {
    test('should allow instantiating with an options object', () => {
      const service = new CheckoutService({
        paymentGateway: paymentGatewayMock,
        ticketGenerator: ticketGeneratorMock,
        invoiceGenerator: invoiceGeneratorMock,
        emailSender: emailSenderMock,
      });

      expect(service.paymentGateway).toBe(paymentGatewayMock);
    });

    test('should throw error when any required dependency is missing', () => {
      expect(() => new CheckoutService()).toThrow(
        'paymentGateway, ticketGenerator, invoiceGenerator and emailSender are required'
      );
      expect(
        () => new CheckoutService(paymentGatewayMock, null, invoiceGeneratorMock, emailSenderMock)
      ).toThrow('paymentGateway, ticketGenerator, invoiceGenerator and emailSender are required');
    });

    test('should throw error when checkoutRequest is missing in processCheckout', async () => {
      await expect(checkoutService.processCheckout(null)).rejects.toThrow(
        'checkoutRequest is required'
      );
    });
  });

  describe('CheckoutRequest validation', () => {
    test('should throw error when bookingId is missing', () => {
      expect(() => new CheckoutRequest({ ...validRequestData, bookingId: '' })).toThrow(
        'bookingId is required'
      );
    });

    test('should throw error when passengerEmail is invalid', () => {
      expect(
        () => new CheckoutRequest({ ...validRequestData, passengerEmail: 'invalid-email' })
      ).toThrow('passengerEmail must be a valid email address');
    });

    test('should throw error when amount is missing', () => {
      expect(() => new CheckoutRequest({ ...validRequestData, amount: null })).toThrow(
        'amount is required'
      );
    });

    test('should throw error when creditCardToken is missing', () => {
      expect(() => new CheckoutRequest({ ...validRequestData, creditCardToken: '' })).toThrow(
        'creditCardToken is required'
      );
    });

    test('should be immutable', () => {
      const request = new CheckoutRequest(validRequestData);
      expect(Object.isFrozen(request)).toBe(true);
      expect(() => {
        request.passengerName = 'Other';
      }).toThrow(TypeError);
    });
  });
});
