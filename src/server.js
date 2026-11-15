import dotenv from 'dotenv';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { TaskRepository } from './repositories/task-repository.js';

dotenv.config({ quiet: true });

const config = loadConfig();
const pool = createPool(config);
const repository = new TaskRepository(pool);
const app = createApp({ config, repository });
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server listening on port ${config.port}`);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
