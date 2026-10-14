'use strict';

const PaymentRequest = require('../../payments/domain/PaymentRequest');
const Ticket = require('../../ticketing/domain/Ticket');
const Invoice = require('../../billing/domain/Invoice');
const EmailMessage = require('../../notifications/domain/EmailMessage');
const CheckoutResult = require('./CheckoutResult');

class CheckoutService {
  /**
   * @param {Object} paymentGatewayOrOptions
   * @param {Object} [ticketGenerator]
   * @param {Object} [invoiceGenerator]
   * @param {Object} [emailSender]
   */
  constructor(
    paymentGatewayOrOptions,
    ticketGenerator,
    invoiceGenerator,
    emailSender,
    seatReleaser = null
  ) {
    if (
      paymentGatewayOrOptions &&
      typeof paymentGatewayOrOptions === 'object' &&
      typeof paymentGatewayOrOptions.processPayment !== 'function'
    ) {
      this.paymentGateway = paymentGatewayOrOptions.paymentGateway;
      this.ticketGenerator = paymentGatewayOrOptions.ticketGenerator;
      this.invoiceGenerator = paymentGatewayOrOptions.invoiceGenerator;
      this.emailSender = paymentGatewayOrOptions.emailSender;
      this.seatReleaser = paymentGatewayOrOptions.seatReleaser || null;
    } else {
      this.paymentGateway = paymentGatewayOrOptions;
      this.ticketGenerator = ticketGenerator;
      this.invoiceGenerator = invoiceGenerator;
      this.emailSender = emailSender;
      this.seatReleaser = seatReleaser || null;
    }

    if (
      !this.paymentGateway ||
      !this.ticketGenerator ||
      !this.invoiceGenerator ||
      !this.emailSender
    ) {
      throw new Error(
        'paymentGateway, ticketGenerator, invoiceGenerator and emailSender are required'
      );
    }
  }

  /**
   * Orchestrates the checkout process: payment, PDF ticketing, PDF billing, and notification email.
   * @param {import('./CheckoutRequest')} checkoutRequest
   * @returns {Promise<CheckoutResult>}
   */
  async processCheckout(checkoutRequest) {
    if (!checkoutRequest) {
      throw new Error('checkoutRequest is required');
    }

    // 1. Process payment
    const paymentRequest = new PaymentRequest(
      checkoutRequest.amount,
      checkoutRequest.creditCardToken,
      checkoutRequest.bookingId
    );

    const paymentResult = await this.paymentGateway.processPayment(paymentRequest);

    if (!paymentResult || !paymentResult.isApproved()) {
      if (
        paymentResult &&
        typeof paymentResult.isRejected === 'function' &&
        paymentResult.isRejected() &&
        this.seatReleaser &&
        typeof this.seatReleaser.releaseSeats === 'function'
      ) {
        try {
          await this.seatReleaser.releaseSeats(checkoutRequest.bookingId);
        } catch (releaseError) {
          console.error(
            `Failed to release seats for booking ${checkoutRequest.bookingId}:`,
            releaseError
          );
        }
      }

      return CheckoutResult.paymentFailed(checkoutRequest.bookingId, paymentResult);
    }

    // 2. Generate PDF ticket
    const ticket = new Ticket({
      bookingId: checkoutRequest.bookingId,
      passengerName: checkoutRequest.passengerName,
      flightNumber: checkoutRequest.flightNumber,
      origin: checkoutRequest.origin,
      destination: checkoutRequest.destination,
      departureDate: checkoutRequest.departureDate,
      departureTime: checkoutRequest.departureTime,
      seatNumber: checkoutRequest.seatNumber,
      cabinClass: checkoutRequest.cabinClass,
    });
    const ticketPdf = await this.ticketGenerator.generate(ticket);

    // 3. Generate PDF invoice
    const invoice = new Invoice({
      bookingId: checkoutRequest.bookingId,
      customerName: checkoutRequest.passengerName,
      customerEmail: checkoutRequest.passengerEmail,
      items: [
        {
          description: `Vuelo ${checkoutRequest.flightNumber}: ${checkoutRequest.origin} -> ${checkoutRequest.destination} (${checkoutRequest.cabinClass})`,
          quantity: 1,
          unitPrice: checkoutRequest.amount,
        },
      ],
      totalAmount: checkoutRequest.amount,
      currency: checkoutRequest.amount.currency,
    });
    const invoicePdf = await this.invoiceGenerator.generate(invoice);

    // 4. Send email with attachments
    const baseResult = CheckoutResult.success(
      checkoutRequest.bookingId,
      paymentResult,
      ticketPdf,
      invoicePdf
    );

    const emailMessage = new EmailMessage({
      to: checkoutRequest.passengerEmail,
      subject: 'Tu pasaje electrónico — Malva Airlines',
      body: `
        <h1>¡Gracias por tu compra en Malva Airlines!</h1>
        <p>Hola ${checkoutRequest.passengerName},</p>
        <p>Tu reserva <strong>${checkoutRequest.bookingId}</strong> ha sido confirmada con éxito.</p>
        <p>Adjunto encontrarás tu pasaje electrónico y la factura correspondiente.</p>
      `,
      attachments: [
        {
          filename: `Pasaje-${checkoutRequest.bookingId}.pdf`,
          content: ticketPdf,
        },
        {
          filename: `Factura-${checkoutRequest.bookingId}.pdf`,
          content: invoicePdf,
        },
      ],
    });

    let emailSent = false;
    let emailError = null;

    try {
      const emailResponse = await this.emailSender.send(emailMessage);
      emailSent = Boolean(emailResponse && emailResponse.success !== false);
    } catch (error) {
      emailSent = false;
      emailError = error.message || String(error);
    }

    return CheckoutResult.withEmailResult(baseResult, emailSent, emailError);
  }
}

module.exports = CheckoutService;
