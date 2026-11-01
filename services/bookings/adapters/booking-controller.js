const FlightInstance = require('../../flights/domain/flight-instance');

class BookingController {
  constructor({ flightRepository, seatFactory, getAvailability, createBooking, confirmBooking, bookingRepository }) {
    this.flightRepository = flightRepository;
    this.seatFactory = seatFactory;
    this.getAvailability = getAvailability;
    this.createBooking = createBooking;
    this.confirmBooking = confirmBooking;
    this.bookingRepository = bookingRepository;
  }

  async availability(request, response, next) {
    try {
      const availability = await this.getAvailability.execute(request.params.flightInstanceId);
      response.json(availability.map(({ seat, status }) => ({
        id: seat.id,
        number: seat.number,
        cabinClass: seat.cabinClass,
        status
      })));
    } catch (error) {
      this._sendError(response, error);
      if (response.headersSent) next(error);
    }
  }

  async create(request, response) {
    try {
      const identity = FlightInstance.parseId(request.body.flightInstanceId);
      const flight = await this.flightRepository.findById(identity.flightId);
      if (!flight) return response.status(404).json({ error: 'flight not found' });
      const flightInstanceId = identity.date
        ? new FlightInstance(flight, identity.date).id
        : flight.id;
      this.seatFactory.ensureForFlight(flight, flightInstanceId);
      const booking = await this.createBooking.execute({ ...request.body, flightInstanceId });
      response.status(201).json(this._serialize(booking));
    } catch (error) {
      this._sendError(response, error);
    }
  }

  async get(request, response) {
    const booking = await this.bookingRepository.findById(request.params.bookingId);
    if (!booking) return response.status(404).json({ error: 'booking not found' });
    return response.json(this._serialize(booking));
  }

  async confirm(request, response) {
    try {
      response.json(this._serialize(await this.confirmBooking.execute(request.params.bookingId)));
    } catch (error) {
      this._sendError(response, error);
    }
  }

  _serialize(booking) {
    return {
      id: booking.id,
      flightInstanceId: booking.flightInstanceId,
      holdId: booking.holdId,
      passengers: booking.passengers,
      status: booking.status
    };
  }

  _sendError(response, error) {
    const message = error.message;
    const status = message.includes('not found') ? 404 :
      message.includes('already held') || message.includes('expired') ? 409 : 400;
    response.status(status).json({ error: message });
  }
}

module.exports = BookingController;
