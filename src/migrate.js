import dotenv from 'dotenv';
import { readdir, readFile } from 'node:fs/promises';
import { loadConfig } from './config.js';
import { createPool } from './db.js';

dotenv.config({ quiet: true });

async function migrate() {
  const config = loadConfig();
  const pool = createPool(config);
  const migrationsDirectory = new URL('../migrations/', import.meta.url);
  try {
    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort();
    for (const file of files) {
      await pool.query(await readFile(new URL(file, migrationsDirectory), 'utf8'));
      console.log(`Applied ${file}`);
    }
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
