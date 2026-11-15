import { AuthenticationError, NotFoundError, ValidationError } from '../errors.js';

const INVALID_BODY_TYPES = new Set([
  'entity.parse.failed',
  'entity.too.large',
  'encoding.unsupported',
  'charset.unsupported',
  'request.aborted',
  'request.size.invalid',
]);

export function createErrorHandler(logger = console) {
  return (error, _request, response, _next) => {
    if (error instanceof AuthenticationError) {
      response.set('WWW-Authenticate', 'Bearer');
      return response.status(401).json({ error: error.message });
    }
    if (error instanceof ValidationError || INVALID_BODY_TYPES.has(error.type)) {
      const message = error instanceof ValidationError ? error.message : 'invalid JSON or request body';
      return response.status(400).json({ error: message });
    }
    if (error instanceof NotFoundError) {
      return response.status(404).json({ error: error.message });
    }
    logger.error(error);
    return response.status(503).json({ error: 'database or service unavailable' });
  };
}

export function apiNotFound(_request, response) {
  response.status(404).json({ error: 'route not found' });
}

export function pageNotFound(_request, response) {
  response.status(404).type('text/plain').send('Not found');
}
