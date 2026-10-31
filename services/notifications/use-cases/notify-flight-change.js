'use strict';

const EmailMessage = require('../domain/EmailMessage');
const flightScheduleChangeTemplate = require('../templates/flight-schedule-change');
const flightCancellationTemplate = require('../templates/flight-cancellation');

class NotifyFlightChange {
  /**
   * @param {Object} dependencies
   * @param {Object} dependencies.bookingRepository - Booking repository port
   * @param {Object} dependencies.emailSender - EmailSender port
   */
  constructor({ bookingRepository, emailSender } = {}) {
    if (!bookingRepository) {
      throw new Error('bookingRepository is required');
    }
    if (!emailSender) {
      throw new Error('emailSender is required');
    }
    this.bookingRepository = bookingRepository;
    this.emailSender = emailSender;
  }

  /**
   * Notifies affected confirmed passengers about a flight modification or cancellation.
   *
   * @param {Object} params
   * @param {Object} params.flight - Current/updated Flight instance
   * @param {Object} [params.previousFlight] - Previous Flight instance (for schedule diffs)
   * @param {'SCHEDULE_CHANGE'|'CANCELLATION'} params.changeType - Notification type
   * @returns {Promise<{ sent: number, failed: number }>}
   */
  async execute({ flight, previousFlight = null, changeType } = {}) {
    if (!flight || !flight.id) {
      return { sent: 0, failed: 0 };
    }

    if (!['SCHEDULE_CHANGE', 'CANCELLATION'].includes(changeType)) {
      throw new Error(`Invalid changeType: ${changeType}`);
    }

    const bookings = await this.bookingRepository.findByFlightInstanceId(flight.id);
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const emailMessages = [];

    for (const booking of bookings) {
      const passengers = booking.passengers || [];
      for (const passenger of passengers) {
        if (!passenger.email) continue;

        let templateResult;
        if (changeType === 'SCHEDULE_CHANGE') {
          templateResult = flightScheduleChangeTemplate({
            passengerName: passenger.name,
            flightNumber: flight.flightNumber,
            origin: flight.originAirport,
            destination: flight.destinationAirport,
            oldDepartureTime: previousFlight ? previousFlight.departureTime : undefined,
            newDepartureTime: flight.departureTime,
            oldArrivalTime: previousFlight ? previousFlight.arrivalTime : undefined,
            newArrivalTime: flight.arrivalTime,
          });
        } else {
          templateResult = flightCancellationTemplate({
            passengerName: passenger.name,
            flightNumber: flight.flightNumber,
            origin: flight.originAirport,
            destination: flight.destinationAirport,
            departureTime: flight.departureTime,
          });
        }

        try {
          const emailMessage = new EmailMessage({
            to: passenger.email,
            subject: templateResult.subject,
            body: templateResult.body,
          });
          emailMessages.push(emailMessage);
        } catch (err) {
          console.error(`Error creating email for ${passenger.name}:`, err.message);
        }
      }
    }

    if (emailMessages.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const sendResults = await Promise.allSettled(
      emailMessages.map((msg) => this.emailSender.send(msg))
    );

    let sent = 0;
    let failed = 0;

    for (const res of sendResults) {
      if (res.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        console.error('Error sending flight notification email:', res.reason);
      }
    }

    return { sent, failed };
  }
}

module.exports = NotifyFlightChange;
