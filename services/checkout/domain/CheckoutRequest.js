'use strict';

const Money = require('../../payments/domain/Money');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REQUIRED_STRING_FIELDS = [
  'bookingId',
  'passengerName',
  'flightNumber',
  'origin',
  'destination',
  'departureDate',
  'departureTime',
  'seatNumber',
  'cabinClass',
  'creditCardToken',
];

class CheckoutRequest {
  /**
   * @param {Object} data
   * @param {string} data.bookingId
   * @param {string} data.passengerName
   * @param {string} data.passengerEmail
   * @param {string} data.flightNumber
   * @param {string} data.origin
   * @param {string} data.destination
   * @param {string} data.departureDate
   * @param {string} data.departureTime
   * @param {string} data.seatNumber
   * @param {string} data.cabinClass
   * @param {Money} data.amount
   * @param {string} data.creditCardToken
   */
  constructor(dataOrBookingId = {}, ...rest) {
    let data;
    if (typeof dataOrBookingId === 'object' && dataOrBookingId !== null) {
      data = { ...dataOrBookingId };
    } else {
      data = {
        bookingId: dataOrBookingId,
        passengerName: rest[0],
        passengerEmail: rest[1],
        flightNumber: rest[2],
        origin: rest[3],
        destination: rest[4],
        departureDate: rest[5],
        departureTime: rest[6],
        seatNumber: rest[7],
        cabinClass: rest[8],
        amount: rest[9],
        creditCardToken: rest[10],
      };
    }

    for (const field of REQUIRED_STRING_FIELDS) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        (typeof data[field] === 'string' && data[field].trim() === '')
      ) {
        throw new Error(`${field} is required`);
      }
    }

    if (
      !data.passengerEmail ||
      typeof data.passengerEmail !== 'string' ||
      !EMAIL_REGEX.test(data.passengerEmail.trim())
    ) {
      throw new Error('passengerEmail must be a valid email address');
    }

    if (!data.amount) {
      throw new Error('amount is required');
    }

    if (data.amount instanceof Money) {
      this.amount = data.amount;
    } else if (typeof data.amount === 'number') {
      this.amount = new Money(data.amount, data.currency || 'USD');
    } else {
      throw new Error('amount must be an instance of Money');
    }

    this.bookingId = data.bookingId.trim();
    this.passengerName = data.passengerName.trim();
    this.passengerEmail = data.passengerEmail.trim();
    this.flightNumber = data.flightNumber.trim();
    this.origin = data.origin.trim();
    this.destination = data.destination.trim();
    this.departureDate = data.departureDate.trim();
    this.departureTime = data.departureTime.trim();
    this.seatNumber = data.seatNumber.trim();
    this.cabinClass = data.cabinClass.trim();
    this.creditCardToken = data.creditCardToken.trim();

    Object.freeze(this);
  }
}

module.exports = CheckoutRequest;
