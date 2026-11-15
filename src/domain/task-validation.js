import { ValidationError } from '../errors.js';

const RUN_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireJsonObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('JSON object expected');
  }
}

function assertKeys(body, allowed, required = []) {
  const keys = Object.keys(body);
  const extra = keys.filter((key) => !allowed.includes(key));
  const missing = required.filter((key) => !Object.hasOwn(body, key));
  if (extra.length > 0) throw new ValidationError(`unexpected field: ${extra[0]}`);
  if (missing.length > 0) throw new ValidationError(`missing field: ${missing[0]}`);
}

function validateTitle(value) {
  if (typeof value !== 'string') throw new ValidationError('title must be a string');
  const title = value.trim();
  if (Array.from(title).length < 1 || Array.from(title).length > 200) {
    throw new ValidationError('title must contain 1 to 200 characters after trim');
  }
  return title;
}

export function validateRunId(value) {
  if (typeof value !== 'string' || !RUN_ID_PATTERN.test(value)) {
    throw new ValidationError('runId must contain 1 to 64 letters, digits, underscores or hyphens');
  }
  return value;
}

export function validateId(value) {
  if (!UUID_PATTERN.test(value)) throw new ValidationError('invalid task UUID');
  return value;
}

export function validateCreate(body) {
  requireJsonObject(body);
  assertKeys(body, ['title', 'runId'], ['title', 'runId']);
  return { title: validateTitle(body.title), runId: validateRunId(body.runId) };
}

export function validatePatch(body) {
  requireJsonObject(body);
  assertKeys(body, ['title', 'done']);
  if (Object.keys(body).length === 0) throw new ValidationError('at least one field is required');

  const changes = {};
  if (Object.hasOwn(body, 'title')) changes.title = validateTitle(body.title);
  if (Object.hasOwn(body, 'done')) {
    if (typeof body.done !== 'boolean') throw new ValidationError('done must be a boolean');
    changes.done = body.done;
  }
  return changes;
}
