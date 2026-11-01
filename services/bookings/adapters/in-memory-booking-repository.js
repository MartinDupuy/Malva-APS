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

  findByFlightInstanceId(flightInstanceId) {
    const results = [];
    for (const booking of this.bookings.values()) {
      if (booking.flightInstanceId === flightInstanceId && booking.status === 'CONFIRMED') {
        results.push(booking);
      }
    }
    return results;
  }

  findByFlightId(flightId) {
    return [...this.bookings.values()].filter(booking =>
      (booking.flightInstanceId === flightId || booking.flightInstanceId.startsWith(`${flightId}::`))
      && booking.status === 'CONFIRMED'
    );
  }
}

module.exports = InMemoryBookingRepository;
