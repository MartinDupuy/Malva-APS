const express = require('express');

function createFlightRouter(controller) {
  const router = express.Router();
  router.post('/', controller.create.bind(controller));
  router.get('/search', controller.search.bind(controller));
  router.get('/', controller.list.bind(controller));
  router.put('/:id', controller.update.bind(controller));
  router.delete('/:id', controller.cancel.bind(controller));
  return router;
}

module.exports = createFlightRouter;
