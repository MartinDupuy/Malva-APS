const { BOOKING_STATUSES } = require('../domain/booking');

class ConfirmBooking {
  constructor(bookingRepository, seatHoldRepository) {
    this.bookingRepository = bookingRepository;
    this.seatHoldRepository = seatHoldRepository;
  }

  execute(bookingId) {
    const booking = this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error('booking not found');
    if (booking.status !== BOOKING_STATUSES.HELD) return booking;

    this.seatHoldRepository.confirm(booking.holdId);
    return this.bookingRepository.create(booking.confirm());
  }
}

module.exports = ConfirmBooking;