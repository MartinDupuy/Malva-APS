const express = require('express');
const InMemoryFlightRepository = require('./services/flights/adapters/in-memory-flight-repository');
const FlightController = require('./services/flights/adapters/flight-controller');
const createFlightRouter = require('./infra/flight-router');

function createApp() {
  const app = express();
  const flightRepository = createFlightRepository(process.env.FLIGHT_REPOSITORY || 'memory');
  const flightController = new FlightController(flightRepository);

  app.use(express.json({ limit: '1mb' }));
  app.use('/api/flights', createFlightRouter(flightController));
  app.use(handleApiError);
  return app;
}

function createServer() {
  return createApp();
}

function handleApiError(error, request, response, next) {
  if (response.headersSent) return next(error);
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body is too large' });
  }
  if (error instanceof SyntaxError && error.status === 400 && error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Request body must be valid JSON' });
  }
  return response.status(500).json({ error: error.message });
}

function createFlightRepository(repositoryType) {
  if (repositoryType === 'memory') return new InMemoryFlightRepository();
  throw new Error(`Unsupported flight repository: ${repositoryType}`);
}

const server = createServer();
const port = Number(process.env.PORT) || 3000;

if (require.main === module) {
  server.listen(port, () => console.log(`Flight API listening on port ${port}`));
}

module.exports = { createApp, createServer, server };
