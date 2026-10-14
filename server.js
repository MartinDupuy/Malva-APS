const http = require('http');
const FlightRepository = require('./services/flights/adapters/flight-repository');
const FlightController = require('./services/flights/adapters/flight-controller');
const { createRouter } = require('./infra/http-router');

function createServer() {
  const flightRepository = new FlightRepository();
  const flightController = new FlightController(flightRepository);
  const routes = [
    { method: 'POST', path: '/api/flights', handler: flightController.create.bind(flightController) },
    { method: 'GET', path: '/api/flights', handler: flightController.list.bind(flightController) },
    { method: 'PUT', path: '/api/flights/:id', handler: flightController.update.bind(flightController) },
    { method: 'DELETE', path: '/api/flights/:id', handler: flightController.cancel.bind(flightController) }
  ];
  const router = createRouter(routes);
  return http.createServer(router);
}

const server = createServer();
const port = Number(process.env.PORT) || 3000;

if (require.main === module) {
  server.listen(port, () => console.log(`Flight API listening on port ${port}`));
}

module.exports = { createServer, server };
