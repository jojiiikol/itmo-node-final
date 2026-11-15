import express from 'express';
import { fileURLToPath } from 'node:url';
import { AuthService } from './services/auth-service.js';
import { TaskService } from './services/task-service.js';
import { createAuthenticate } from './middleware/authenticate.js';
import { apiNotFound, createErrorHandler, pageNotFound } from './middleware/error-handler.js';
import { createAuthRouter, createPublicAuthRouter } from './routes/auth-routes.js';
import { createTaskRouter } from './routes/task-routes.js';
import { createSystemRouter } from './routes/system-routes.js';

const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));

export function createApp({ config, repository, logger = console }) {
  const app = express();
  const authService = new AuthService(config);
  const taskService = new TaskService({ repository, ownerLogin: config.login });
  const api = express.Router({ strict: true });

  app.disable('x-powered-by');
  app.set('strict routing', true);
  app.use(express.static(publicDirectory));
  app.use(createSystemRouter());
  app.use(createPublicAuthRouter(authService));

  api.use(createAuthenticate(authService));
  api.use(express.json({ limit: '16kb', strict: true }));
  api.use(createAuthRouter(authService));
  api.use(createTaskRouter(taskService));
  api.use(apiNotFound);

  app.use('/api', api);
  app.use(pageNotFound);
  app.use(createErrorHandler(logger));
  return app;
}
