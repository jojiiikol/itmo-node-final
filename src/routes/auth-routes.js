import { Router } from 'express';

export function createPublicAuthRouter(authService) {
  const router = Router({ strict: true });
  router.get('/login/', (_request, response) => {
    response.type('text/plain').send(authService.getLogin());
  });
  return router;
}

export function createAuthRouter(authService) {
  const router = Router({ strict: true });
  router.get('/author/', (_request, response) => {
    response.json(authService.getAuthor());
  });
  router.get('/session/', (request, response) => {
    response.json(authService.getSession(request.auth));
  });
  return router;
}
