'use strict';

const CheckoutService = require('../../services/checkout/domain/CheckoutService');
const CheckoutRequest = require('../../services/checkout/domain/CheckoutRequest');
const SeatReleaser = require('../../services/checkout/domain/SeatReleaser');
const PaymentResult = require('../../services/payments/domain/PaymentResult');
const Money = require('../../services/payments/domain/Money');

describe('CheckoutService - Seat Release on Payment Failure', () => {
  let paymentGatewayMock;
  let ticketGeneratorMock;
  let invoiceGeneratorMock;
  let emailSenderMock;
  let seatReleaserMock;

  const validRequestData = {
    bookingId: 'BK-SEAT-100',
    passengerName: 'Carlos Tévez',
    passengerEmail: 'carlos.tevez@example.com',
    flightNumber: 'MV-321',
    origin: 'EZE',
    destination: 'GRU',
    departureDate: '2026-11-25',
    departureTime: '10:00',
    seatNumber: '05C',
    cabinClass: 'Economy',
    amount: new Money(45000, 'USD'),
    creditCardToken: 'tok_visa_declined',
  };

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
    seatReleaserMock = {
      releaseSeats: jest.fn(),
    };
  });

  test('SeatReleaser port should throw "Method not implemented."', async () => {
    const releaser = new SeatReleaser();
    await expect(releaser.releaseSeats('BK-1')).rejects.toThrow('Method not implemented.');
  });

  test('when payment is rejected and SeatReleaser is injected, calls releaseSeats(bookingId)', async () => {
    const paymentResult = PaymentResult.rejected('Insufficient funds');
    paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);
    seatReleaserMock.releaseSeats.mockResolvedValueOnce();

    const checkoutService = new CheckoutService(
      paymentGatewayMock,
      ticketGeneratorMock,
      invoiceGeneratorMock,
      emailSenderMock,
      seatReleaserMock
    );

    const request = new CheckoutRequest(validRequestData);
    const result = await checkoutService.processCheckout(request);

    expect(paymentGatewayMock.processPayment).toHaveBeenCalledTimes(1);
    expect(seatReleaserMock.releaseSeats).toHaveBeenCalledTimes(1);
    expect(seatReleaserMock.releaseSeats).toHaveBeenCalledWith('BK-SEAT-100');
    expect(result.isPaymentApproved()).toBe(false);
  });

  test('when payment is rejected without SeatReleaser injected, does not fail and returns normally', async () => {
    const paymentResult = PaymentResult.rejected('Card expired');
    paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);

    const checkoutService = new CheckoutService(
      paymentGatewayMock,
      ticketGeneratorMock,
      invoiceGeneratorMock,
      emailSenderMock
      // seatReleaser omitted
    );

    const request = new CheckoutRequest(validRequestData);
    const result = await checkoutService.processCheckout(request);

    expect(paymentGatewayMock.processPayment).toHaveBeenCalledTimes(1);
    expect(result.isPaymentApproved()).toBe(false);
  });

  test('when payment is rejected and releaseSeats throws an error, error is caught and checkoutResult is still paymentFailed', async () => {
    const paymentResult = PaymentResult.rejected('Transaction declined');
    paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);
    seatReleaserMock.releaseSeats.mockRejectedValueOnce(new Error('Seat service DB connection timeout'));

    // Spy on console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const checkoutService = new CheckoutService(
      paymentGatewayMock,
      ticketGeneratorMock,
      invoiceGeneratorMock,
      emailSenderMock,
      seatReleaserMock
    );

    const request = new CheckoutRequest(validRequestData);
    const result = await checkoutService.processCheckout(request);

    expect(seatReleaserMock.releaseSeats).toHaveBeenCalledWith('BK-SEAT-100');
    expect(result.isPaymentApproved()).toBe(false);
    expect(result.paymentResult.isRejected()).toBe(true);

    consoleErrorSpy.mockRestore();
  });

  test('when payment is approved, releaseSeats is NOT called', async () => {
    const paymentResult = PaymentResult.approved('tx_ok_123');
    paymentGatewayMock.processPayment.mockResolvedValueOnce(paymentResult);
    ticketGeneratorMock.generate.mockResolvedValueOnce(Buffer.from('ticket'));
    invoiceGeneratorMock.generate.mockResolvedValueOnce(Buffer.from('invoice'));
    emailSenderMock.send.mockResolvedValueOnce({ success: true, messageId: 'm1' });

    const checkoutService = new CheckoutService(
      paymentGatewayMock,
      ticketGeneratorMock,
      invoiceGeneratorMock,
      emailSenderMock,
      seatReleaserMock
    );

    const request = new CheckoutRequest(validRequestData);
    const result = await checkoutService.processCheckout(request);

    expect(result.isPaymentApproved()).toBe(true);
    expect(seatReleaserMock.releaseSeats).not.toHaveBeenCalled();
  });
});
