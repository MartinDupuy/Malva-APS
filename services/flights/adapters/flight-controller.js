const CreateFlight = require('../use-cases/create-flight');
const UpdateFlight = require('../use-cases/update-flight');
const CancelFlight = require('../use-cases/cancel-flight');
const SearchFlights = require('../use-cases/search-flights');

class FlightController {
  constructor(flightRepository) {
    this.createFlight = new CreateFlight(flightRepository);
    this.updateFlight = new UpdateFlight(flightRepository);
    this.cancelFlight = new CancelFlight(flightRepository);
    this.searchFlights = new SearchFlights(flightRepository);
    this.flightRepository = flightRepository;
  }

  async create(request, response) {
    return this._execute(response, 201, () => this.createFlight.execute(request.body));
  }

  async update(request, response) {
    return this._execute(response, 200, () => this.updateFlight.execute(request.params.id, request.body));
  }

  async cancel(request, response) {
    return this._execute(response, 200, () => this.cancelFlight.execute(request.params.id));
  }

  async list(request, response) {
    return this._execute(response, 200, () => this.flightRepository.findAll());
  }

  async search(request, response) {
    return this._execute(response, 200, () => this.searchFlights.execute(request.query));
  }

  async _execute(response, successStatus, operation) {
    try {
      const result = await operation();
      response.status(successStatus).json(result);
    } catch (error) {
      const status = error.message === 'Flight not found' ? 404 : 400;
      response.status(status).json({ error: error.message });
    }
  }
}

module.exports = FlightController;
