'use strict';

const CheckoutService = require('../../services/checkout/domain/CheckoutService');
const CheckoutRequest = require('../../services/checkout/domain/CheckoutRequest');
const PdfTicketGenerator = require('../../services/ticketing/adapters/PdfTicketGenerator');
const PdfInvoiceGenerator = require('../../services/billing/adapters/PdfInvoiceGenerator');
const PaymentResult = require('../../services/payments/domain/PaymentResult');
const Money = require('../../services/payments/domain/Money');

describe('Checkout Integration Test (End-to-End with Real PDF Generators)', () => {
  let paymentGatewayMock;
  let emailSenderMock;
  let seatReleaserMock;
  let realTicketGenerator;
  let realInvoiceGenerator;
  let checkoutService;

  const validCheckoutRequest = new CheckoutRequest({
    bookingId: 'BK-INT-777',
    passengerName: 'Valeria Lynch',
    passengerEmail: 'valeria.lynch@example.com',
    flightNumber: 'MV-909',
    origin: 'EZE',
    destination: 'MIA',
    departureDate: '2026-12-15',
    departureTime: '23:30',
    seatNumber: '04A',
    cabinClass: 'Business',
    amount: new Money(180000, 'USD'),
    creditCardToken: 'tok_visa_approved_integration',
  });

  beforeEach(() => {
    paymentGatewayMock = {
      processPayment: jest.fn(),
    };
    emailSenderMock = {
      send: jest.fn(),
    };
    seatReleaserMock = {
      releaseSeats: jest.fn(),
    };

    // Use REAL PDF adapters for ticketing and billing
    realTicketGenerator = new PdfTicketGenerator();
    realInvoiceGenerator = new PdfInvoiceGenerator();

    checkoutService = new CheckoutService(
      paymentGatewayMock,
      realTicketGenerator,
      realInvoiceGenerator,
      emailSenderMock,
      seatReleaserMock
    );
  });

  test('full success flow: payment approved -> real PDFs generated -> email dispatched with real PDFs', async () => {
    // 1. Payment gateway approves
    const paymentResult = PaymentResult.approved('tx_integration_9999');
    paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);

    // 4. Email sender succeeds
    emailSenderMock.send.mockResolvedValueOnce({
      success: true,
      messageId: '<int-email-123@malvaairlines.com>',
    });

    const result = await checkoutService.processCheckout(validCheckoutRequest);

    // Verify payment was processed
    expect(paymentGatewayMock.processPayment).toHaveBeenCalledTimes(1);

    // Verify real PDFs were generated
    expect(Buffer.isBuffer(result.ticketPdf)).toBe(true);
    expect(result.ticketPdf.length).toBeGreaterThan(500);
    expect(result.ticketPdf.subarray(0, 4).toString('ascii')).toBe('%PDF');

    expect(Buffer.isBuffer(result.invoicePdf)).toBe(true);
    expect(result.invoicePdf.length).toBeGreaterThan(500);
    expect(result.invoicePdf.subarray(0, 4).toString('ascii')).toBe('%PDF');

    // Verify EmailSender was called with the actual generated PDF buffers
    expect(emailSenderMock.send).toHaveBeenCalledTimes(1);
    const sentEmail = emailSenderMock.send.mock.calls[0][0];
    expect(sentEmail.to).toBe('valeria.lynch@example.com');
    expect(sentEmail.subject).toBe('Tu pasaje electrónico — Malva Airlines');
    expect(sentEmail.attachments).toHaveLength(2);
    expect(sentEmail.attachments[0].filename).toBe('Pasaje-BK-INT-777.pdf');
    expect(sentEmail.attachments[0].content).toEqual(result.ticketPdf);
    expect(sentEmail.attachments[1].filename).toBe('Factura-BK-INT-777.pdf');
    expect(sentEmail.attachments[1].content).toEqual(result.invoicePdf);

    // Verify final result
    expect(result.isPaymentApproved()).toBe(true);
    expect(result.bookingId).toBe('BK-INT-777');
    expect(result.emailSent).toBe(true);
    expect(result.emailError).toBeNull();

    // Verify seats were not released
    expect(seatReleaserMock.releaseSeats).not.toHaveBeenCalled();
  });

  test('negative flow: payment rejected -> no PDFs generated, no email sent, locked seats released', async () => {
    const paymentResult = PaymentResult.rejected('Credit limit exceeded');
    paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);
    seatReleaserMock.releaseSeats.mockResolvedValueOnce();

    const result = await checkoutService.processCheckout(validCheckoutRequest);

    expect(paymentGatewayMock.processPayment).toHaveBeenCalledTimes(1);
    expect(emailSenderMock.send).not.toHaveBeenCalled();
    expect(seatReleaserMock.releaseSeats).toHaveBeenCalledTimes(1);
    expect(seatReleaserMock.releaseSeats).toHaveBeenCalledWith('BK-INT-777');

    expect(result.isPaymentApproved()).toBe(false);
    expect(result.ticketPdf).toBeNull();
    expect(result.invoicePdf).toBeNull();
    expect(result.emailSent).toBe(false);
  });

  test('resilience flow: payment approved and PDFs generated, but email sender fails -> payment maintained and error recorded', async () => {
    const paymentResult = PaymentResult.approved('tx_integration_8888');
    paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);
    emailSenderMock.send.mockRejectedValueOnce(new Error('SMTP connection refused'));

    const result = await checkoutService.processCheckout(validCheckoutRequest);

    expect(result.isPaymentApproved()).toBe(true);
    expect(Buffer.isBuffer(result.ticketPdf)).toBe(true);
    expect(result.ticketPdf.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(Buffer.isBuffer(result.invoicePdf)).toBe(true);
    expect(result.invoicePdf.subarray(0, 4).toString('ascii')).toBe('%PDF');

    expect(result.emailSent).toBe(false);
    expect(result.emailError).toBe('SMTP connection refused');
    expect(seatReleaserMock.releaseSeats).not.toHaveBeenCalled();
  });
});
