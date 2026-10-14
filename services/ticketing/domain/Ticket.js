'use strict';

const crypto = require('crypto');

const REQUIRED_FIELDS = [
  'bookingId',
  'passengerName',
  'flightNumber',
  'origin',
  'destination',
  'departureDate',
  'departureTime',
  'seatNumber',
  'cabinClass',
];

class Ticket {
  /**
   * @param {Object} data
   * @param {string} [data.ticketId]
   * @param {string} data.bookingId
   * @param {string} data.passengerName
   * @param {string} data.flightNumber
   * @param {string} data.origin
   * @param {string} data.destination
   * @param {string} data.departureDate
   * @param {string} data.departureTime
   * @param {string} data.seatNumber
   * @param {string} data.cabinClass
   * @param {Date|string} [data.issuedAt]
   */
  constructor(dataOrTicketId = {}, ...rest) {
    let data;
    if (typeof dataOrTicketId === 'object' && dataOrTicketId !== null && !(dataOrTicketId instanceof Date)) {
      data = { ...dataOrTicketId };
    } else {
      data = {
        ticketId: dataOrTicketId,
        bookingId: rest[0],
        passengerName: rest[1],
        flightNumber: rest[2],
        origin: rest[3],
        destination: rest[4],
        departureDate: rest[5],
        departureTime: rest[6],
        seatNumber: rest[7],
        cabinClass: rest[8],
        issuedAt: rest[9],
      };
    }

    for (const field of REQUIRED_FIELDS) {
      if (data[field] === undefined || data[field] === null || (typeof data[field] === 'string' && data[field].trim() === '')) {
        throw new Error(`${field} is required`);
      }
    }

    this.ticketId = data.ticketId || crypto.randomUUID();
    this.bookingId = data.bookingId;
    this.passengerName = data.passengerName;
    this.flightNumber = data.flightNumber;
    this.origin = data.origin;
    this.destination = data.destination;
    this.departureDate = data.departureDate;
    this.departureTime = data.departureTime;
    this.seatNumber = data.seatNumber;
    this.cabinClass = data.cabinClass;
    this.issuedAt = data.issuedAt
      ? (data.issuedAt instanceof Date ? data.issuedAt : new Date(data.issuedAt))
      : new Date();

    Object.freeze(this);
  }
}

module.exports = Ticket;
