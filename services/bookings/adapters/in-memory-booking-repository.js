class InMemoryBookingRepository {
  constructor() {
    this.bookings = new Map();
  }

  create(booking) {
    this.bookings.set(booking.id, booking);
    return booking;
  }

  findById(bookingId) {
    return this.bookings.get(bookingId) || null;
  }
}

module.exports = InMemoryBookingRepository;