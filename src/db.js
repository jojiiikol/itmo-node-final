import pg from 'pg';

export function createPool(config) {
  return new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  });
}
