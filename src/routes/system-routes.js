import { Router } from 'express';

export function createSystemRouter() {
  const router = Router({ strict: true });
  router.get('/health', (_request, response) => response.json({ status: 'ok' }));
  return router;
}
