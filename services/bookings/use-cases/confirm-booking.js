const { BOOKING_STATUSES } = require('../domain/booking');

class ConfirmBooking {
  constructor(bookingRepository, seatHoldRepository) {
    this.bookingRepository = bookingRepository;
    this.seatHoldRepository = seatHoldRepository;
  }

  async execute(bookingId) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error('booking not found');
    if (booking.status !== BOOKING_STATUSES.HELD) return booking;

    await this.seatHoldRepository.confirm(booking.holdId);
    return this.bookingRepository.create(booking.confirm());
  }
}

module.exports = ConfirmBooking;