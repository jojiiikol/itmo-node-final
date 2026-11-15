import { Router } from 'express';

export function createTaskRouter(taskService) {
  const router = Router({ strict: true });

  router.post('/tasks/', async (request, response) => {
    response.status(201).json(await taskService.create(request.body));
  });

  router.get('/tasks/', async (request, response) => {
    response.json(await taskService.list(request.query.runId));
  });

  router.get('/tasks/all/', async (_request, response) => {
    response.json(await taskService.listAll());
  });

  router.get('/tasks/:id/', async (request, response) => {
    response.json(await taskService.get(request.params.id));
  });

  router.patch('/tasks/:id/', async (request, response) => {
    response.json(await taskService.update(request.params.id, request.body));
  });

  router.delete('/tasks/:id/', async (request, response) => {
    await taskService.delete(request.params.id);
    response.status(204).end();
  });

  return router;
}
