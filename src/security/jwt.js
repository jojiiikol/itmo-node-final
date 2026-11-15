import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const JWT_ALGORITHM = 'HS256';
const JWT_AUDIENCE = 'itmo-node-final-api';
const JWT_ISSUER = 'itmo-node-final';
const ROLES = new Set(['owner', 'reviewer']);

function assertRole(role) {
  if (!ROLES.has(role)) throw new Error('JWT role must be owner or reviewer');
}

export function issueAccessToken(role, secret, now = new Date()) {
  assertRole(role);
  const issuedAt = Math.floor(now.getTime() / 1000);
  const expiration = new Date(now);
  const originalDay = expiration.getUTCDate();
  expiration.setUTCDate(1);
  expiration.setUTCMonth(expiration.getUTCMonth() + 3);
  const lastDay = new Date(Date.UTC(
    expiration.getUTCFullYear(),
    expiration.getUTCMonth() + 1,
    0,
  )).getUTCDate();
  expiration.setUTCDate(Math.min(originalDay, lastDay));
  expiration.setUTCMilliseconds(0);

  const token = jwt.sign(
    { role, iat: issuedAt, exp: Math.floor(expiration.getTime() / 1000) },
    secret,
    {
      algorithm: JWT_ALGORITHM,
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
      jwtid: randomUUID(),
      subject: role,
    },
  );

  return { token, expiresAt: expiration.toISOString() };
}

export function verifyAccessToken(token, secret) {
  const payload = jwt.verify(token, secret, {
    algorithms: [JWT_ALGORITHM],
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
  });
  assertRole(payload.role);
  if (payload.sub !== payload.role) throw new Error('JWT subject and role do not match');
  return payload;
}
