const { Booking } = require('../domain/booking');

class CreateBooking {
  constructor(bookingRepository, seatHoldRepository) {
    this.bookingRepository = bookingRepository;
    this.seatHoldRepository = seatHoldRepository;
  }

  execute({ flightInstanceId, passengers }) {
    const booking = new Booking({ flightInstanceId, passengers });
    const hold = this.seatHoldRepository.createHold({
      bookingId: booking.id,
      flightInstanceId,
      seatIds: passengers.map(({ seatId }) => seatId)
    });

    booking.holdId = hold.id;
    return this.bookingRepository.create(booking);
  }
}

module.exports = CreateBooking;