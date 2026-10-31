'use strict';

const CreateFlight = require('../use-cases/create-flight');
const UpdateFlight = require('../use-cases/update-flight');
const CancelFlight = require('../use-cases/cancel-flight');
const SearchFlights = require('../use-cases/search-flights');

class FlightController {
  constructor(flightRepository, optionsOrNotifier = {}) {
    this.createFlight = new CreateFlight(flightRepository);
    this.updateFlight = new UpdateFlight(flightRepository);
    this.cancelFlight = new CancelFlight(flightRepository);
    this.searchFlights = new SearchFlights(flightRepository);
    this.flightRepository = flightRepository;

    if (optionsOrNotifier && typeof optionsOrNotifier.execute === 'function') {
      this.notifyFlightChange = optionsOrNotifier;
    } else if (optionsOrNotifier && optionsOrNotifier.notifyFlightChange) {
      this.notifyFlightChange = optionsOrNotifier.notifyFlightChange;
    } else {
      this.notifyFlightChange = null;
    }
  }

  async create(request, response) {
    return this._execute(response, 201, () => this.createFlight.execute(request.body));
  }

  async update(request, response) {
    return this._execute(response, 200, async () => {
      let previousFlight = null;
      if (this.notifyFlightChange) {
        const existing = await this.flightRepository.findById(request.params.id);
        if (existing) {
          previousFlight = { ...existing };
        }
      }
      const updatedFlight = await this.updateFlight.execute(request.params.id, request.body);
      if (this.notifyFlightChange) {
        this.notifyFlightChange.execute({
          flight: updatedFlight,
          previousFlight,
          changeType: 'SCHEDULE_CHANGE',
        }).catch(err => {
          console.error('Error sending schedule change notification:', err);
        });
      }
      return updatedFlight;
    });
  }

  async cancel(request, response) {
    return this._execute(response, 200, async () => {
      const cancelledFlight = await this.cancelFlight.execute(request.params.id);
      if (this.notifyFlightChange) {
        this.notifyFlightChange.execute({
          flight: cancelledFlight,
          changeType: 'CANCELLATION',
        }).catch(err => {
          console.error('Error sending cancellation notification:', err);
        });
      }
      return cancelledFlight;
    });
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
