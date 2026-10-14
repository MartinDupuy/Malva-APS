const MAX_BODY_SIZE = 1024 * 1024;

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
        reject(new Error('Request body is too large'));
        request.destroy();
      }
    });
    request.on('end', () => parseBody(body, resolve, reject));
    request.on('error', reject);
  });
}

function parseBody(body, resolve, reject) {
  if (!body.trim()) {
    resolve({});
    return;
  }
  try {
    resolve(JSON.parse(body));
  } catch (error) {
    reject(new Error('Request body must be valid JSON'));
  }
}

function createRouter(controller) {
  return async (request, response) => {
    try {
      await dispatch(request, response, controller);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: error.message }));
    }
  };
}

async function dispatch(request, response, controller) {
  const route = matchRoute(request.method, request.url, controller);
  if (!route) {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Route not found' }));
    return;
  }
  request.params = route.params;
  const body = await parseJsonBody(request);
  await route.handler(request, response, body);
}

function matchRoute(method, url, controller) {
  const path = new URL(url, 'http://localhost').pathname;
  if (method === 'POST' && path === '/api/flights') return { handler: flightHandler(controller, 'create') };
  if (method === 'GET' && path === '/api/flights') return { handler: flightHandler(controller, 'list') };
  const match = path.match(/^\/api\/flights\/([^/]+)$/);
  if (!match) return null;
  const handlers = { PUT: 'update', DELETE: 'cancel' };
  return handlers[method]
    ? { handler: flightHandler(controller, handlers[method]), params: { id: match[1] } }
    : null;
}

function flightHandler(controller, method) {
  return (request, response, body) => controller[method](request, response, body);
}

module.exports = { createRouter, parseJsonBody };
