const CreateFlight = require('../use-cases/create-flight');
const UpdateFlight = require('../use-cases/update-flight');
const CancelFlight = require('../use-cases/cancel-flight');

class FlightController {
  constructor(flightRepository) {
    this.createFlight = new CreateFlight(flightRepository);
    this.updateFlight = new UpdateFlight(flightRepository);
    this.cancelFlight = new CancelFlight(flightRepository);
    this.flightRepository = flightRepository;
  }

  async create(request, response, body) {
    return this._execute(response, 201, () => this.createFlight.execute(body));
  }

  async update(request, response, body) {
    return this._execute(response, 200, () => this.updateFlight.execute(request.params.id, body));
  }

  async cancel(request, response) {
    return this._execute(response, 200, () => this.cancelFlight.execute(request.params.id));
  }

  async list(request, response) {
    return this._execute(response, 200, () => this.flightRepository.findAll());
  }

  async _execute(response, successStatus, operation) {
    try {
      const result = await operation();
      sendJson(response, successStatus, result);
    } catch (error) {
      const status = error.message === 'Flight not found' ? 404 : 400;
      sendJson(response, status, { error: error.message });
    }
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

module.exports = FlightController;
