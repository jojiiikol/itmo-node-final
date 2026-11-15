const DEFAULT_PORT = 3000;

function requireValue(value, name) {
  if (!value || !value.trim()) throw new Error(`${name} must be set`);
  return value.trim();
}

export function loadConfig(env = process.env) {
  const jwtSecret = requireValue(env.JWT_SECRET, 'JWT_SECRET');
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');

  const port = Number(env.PORT || DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }

  return {
    port,
    login: requireValue(env.MOODLE_LOGIN, 'MOODLE_LOGIN'),
    fullName: requireValue(env.FULL_NAME, 'FULL_NAME'),
    jwtSecret,
    databaseUrl: requireValue(env.DATABASE_URL, 'DATABASE_URL'),
    databaseSsl: env.DATABASE_SSL === 'true',
  };
}
