import { randomUUID } from 'node:crypto';

const TASK_COLUMNS = `
  id,
  owner_login AS "ownerLogin",
  title,
  done,
  run_id AS "runId",
  created_at AS "createdAt"
`;

export class TaskRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(ownerLogin, { title, runId }) {
    const result = await this.pool.query(
      `INSERT INTO tasks (id, owner_login, title, done, run_id)
       VALUES ($1, $2, $3, false, $4)
       RETURNING ${TASK_COLUMNS}`,
      [randomUUID(), ownerLogin, title, runId],
    );
    return result.rows[0];
  }

  async list(ownerLogin, runId) {
    const result = await this.pool.query(
      `SELECT ${TASK_COLUMNS}
       FROM tasks
       WHERE owner_login = $1 AND run_id = $2
       ORDER BY created_at DESC, id DESC`,
      [ownerLogin, runId],
    );
    return result.rows;
  }

  async listAll(ownerLogin) {
    const result = await this.pool.query(
      `SELECT ${TASK_COLUMNS}
       FROM tasks
       WHERE owner_login = $1
       ORDER BY created_at DESC, id DESC`,
      [ownerLogin],
    );
    return result.rows;
  }

  async find(ownerLogin, id) {
    const result = await this.pool.query(
      `SELECT ${TASK_COLUMNS} FROM tasks WHERE owner_login = $1 AND id = $2`,
      [ownerLogin, id],
    );
    return result.rows[0] || null;
  }

  async update(ownerLogin, id, changes) {
    const assignments = [];
    const values = [ownerLogin, id];
    for (const key of ['title', 'done']) {
      if (Object.hasOwn(changes, key)) {
        values.push(changes[key]);
        assignments.push(`${key} = $${values.length}`);
      }
    }
    const result = await this.pool.query(
      `UPDATE tasks SET ${assignments.join(', ')}
       WHERE owner_login = $1 AND id = $2
       RETURNING ${TASK_COLUMNS}`,
      values,
    );
    return result.rows[0] || null;
  }

  async delete(ownerLogin, id) {
    const result = await this.pool.query(
      'DELETE FROM tasks WHERE owner_login = $1 AND id = $2',
      [ownerLogin, id],
    );
    return result.rowCount > 0;
  }
}
