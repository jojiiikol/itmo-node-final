import { NotFoundError } from '../errors.js';
import { validateCreate, validateId, validatePatch, validateRunId } from '../domain/task-validation.js';

export class TaskService {
  constructor({ repository, ownerLogin }) {
    this.repository = repository;
    this.ownerLogin = ownerLogin;
  }

  create(body) {
    return this.repository.create(this.ownerLogin, validateCreate(body));
  }

  list(runId) {
    return this.repository.list(this.ownerLogin, validateRunId(runId));
  }

  listAll() {
    return this.repository.listAll(this.ownerLogin);
  }

  async get(id) {
    const task = await this.repository.find(this.ownerLogin, validateId(id));
    if (!task) throw new NotFoundError('task not found');
    return task;
  }

  async update(id, body) {
    const task = await this.repository.update(this.ownerLogin, validateId(id), validatePatch(body));
    if (!task) throw new NotFoundError('task not found');
    return task;
  }

  async delete(id) {
    const deleted = await this.repository.delete(this.ownerLogin, validateId(id));
    if (!deleted) throw new NotFoundError('task not found');
  }
}
