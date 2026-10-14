const MAX_BODY_SIZE = 1024 * 1024;

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let rejected = false;
    request.setEncoding('utf8');
    request.on('data', chunk => {
      if (rejected) return;
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
        rejected = true;
        reject(createHttpError(413, 'Request body is too large'));
      }
    });
    request.on('end', () => {
      if (!rejected) parseBody(body, resolve, reject);
    });
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
    reject(createHttpError(400, 'Request body must be valid JSON'));
  }
}

function createRouter(routes) {
  return async (request, response) => {
    try {
      await dispatch(request, response, routes);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: error.message }));
    }
  };
}

async function dispatch(request, response, routes) {
  const route = matchRoute(request.method, request.url, routes);
  if (!route) {
    sendJson(response, 404, { error: 'Route not found' });
    return;
  }
  request.params = route.params;
  const body = await readRequestBody(request, response);
  if (body === null) return;
  await route.handler(request, response, body);
}

async function readRequestBody(request, response) {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return {};
  try {
    return await parseJsonBody(request);
  } catch (error) {
    sendJson(response, error.statusCode || 400, { error: error.message });
    return null;
  }
}

function matchRoute(method, url, routes) {
  const path = new URL(url, 'http://localhost').pathname;
  return routes.map(route => matchRouteDefinition(method, path, route))
    .find(Boolean) || null;
}

function matchRouteDefinition(method, path, route) {
  if (route.method !== method) return null;
  const parameterNames = [];
  const expression = route.path.replace(/:([^/]+)/g, (_, name) => {
    parameterNames.push(name);
    return '([^/]+)';
  });
  const match = path.match(new RegExp(`^${expression}$`));
  if (!match) return null;
  const params = Object.fromEntries(parameterNames.map((name, index) => [name, match[index + 1]]));
  return { handler: route.handler, params };
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

module.exports = { createRouter, parseJsonBody };
