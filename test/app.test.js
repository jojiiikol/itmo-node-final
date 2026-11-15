import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { issueAccessToken } from '../src/security/jwt.js';

const ID = '0d2daed4-8549-4f52-90d1-46356647c11a';
const JWT_SECRET = 'test-secret-that-is-definitely-longer-than-thirty-two-characters';
const OWNER_TOKEN = issueAccessToken('owner', JWT_SECRET).token;
const REVIEWER_TOKEN = issueAccessToken('reviewer', JWT_SECRET).token;

function setup(overrides = {}) {
  const task = {
    id: ID,
    ownerLogin: 'jojiiikol',
    title: 'Test task',
    done: false,
    runId: 'manual',
    createdAt: '2026-11-15T10:00:00.000Z',
  };
  const repository = {
    create: async (_owner, input) => ({ ...task, ...input }),
    list: async () => [task],
    listAll: async () => [task],
    find: async () => task,
    update: async (_owner, _id, changes) => ({ ...task, ...changes }),
    delete: async () => true,
    ...overrides,
  };
  const config = {
    login: 'jojiiikol',
    fullName: 'Test Student',
    jwtSecret: JWT_SECRET,
  };
  return createApp({ config, repository, logger: { error() {} } });
}

test('JWT expires after three calendar months', () => {
  const result = issueAccessToken('owner', JWT_SECRET, new Date('2026-01-31T12:00:00.000Z'));
  assert.equal(result.expiresAt, '2026-04-30T12:00:00.000Z');
});

test('GET /login/ returns plain Moodle login without a token', async () => {
  const response = await request(setup()).get('/login/');
  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /^text\/plain/);
  assert.equal(response.text, 'jojiiikol');
});

test('API rejects missing and invalid bearer tokens', async () => {
  const missing = await request(setup()).get('/api/author/');
  assert.equal(missing.status, 401);
  assert.deepEqual(missing.body, { error: 'invalid or missing bearer token' });

  const invalid = await request(setup()).get('/api/author/').set('Authorization', 'Bearer wrong');
  assert.equal(invalid.status, 401);
});

test('GET /api/author/ returns configured identity', async () => {
  const response = await request(setup())
    .get('/api/author/')
    .set('Authorization', `Bearer ${OWNER_TOKEN}`);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { login: 'jojiiikol', fullName: 'Test Student' });
});

test('GET /api/session/ identifies owner and reviewer tokens', async () => {
  const owner = await request(setup())
    .get('/api/session/')
    .set('Authorization', `Bearer ${OWNER_TOKEN}`);
  assert.equal(owner.status, 200);
  assert.equal(owner.body.role, 'owner');
  assert.equal(owner.body.displayName, 'Test Student');

  const reviewer = await request(setup())
    .get('/api/session/')
    .set('Authorization', `Bearer ${REVIEWER_TOKEN}`);
  assert.equal(reviewer.status, 200);
  assert.equal(reviewer.body.role, 'reviewer');
  assert.equal(reviewer.body.displayName, 'Преподаватель');
  assert.deepEqual(reviewer.body.author, { login: 'jojiiikol', fullName: 'Test Student' });
});

test('expired JWT is rejected', async () => {
  const expired = issueAccessToken('owner', JWT_SECRET, new Date('2020-01-01T00:00:00.000Z')).token;
  const response = await request(setup())
    .get('/api/session/')
    .set('Authorization', `Bearer ${expired}`);
  assert.equal(response.status, 401);
});

test('POST /api/tasks/ validates and trims input', async () => {
  const response = await request(setup())
    .post('/api/tasks/')
    .set('Authorization', `Bearer ${OWNER_TOKEN}`)
    .send({ title: '  Test task  ', runId: 'run_1' });
  assert.equal(response.status, 201);
  assert.equal(response.body.title, 'Test task');
  assert.equal(response.body.runId, 'run_1');
});

test('GET /api/tasks/all/ returns tasks without a runId filter', async () => {
  const response = await request(setup())
    .get('/api/tasks/all/')
    .set('Authorization', `Bearer ${OWNER_TOKEN}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].ownerLogin, 'jojiiikol');
});

test('POST rejects extra fields and PATCH rejects wrong done type', async () => {
  const extra = await request(setup())
    .post('/api/tasks/')
    .set('Authorization', `Bearer ${OWNER_TOKEN}`)
    .send({ title: 'Task', runId: 'manual', done: false });
  assert.equal(extra.status, 400);

  const wrongType = await request(setup())
    .patch(`/api/tasks/${ID}/`)
    .set('Authorization', `Bearer ${OWNER_TOKEN}`)
    .send({ done: 'yes' });
  assert.equal(wrongType.status, 400);
});

test('invalid UUID is 400 and missing task is 404', async () => {
  const invalid = await request(setup())
    .get('/api/tasks/not-a-uuid/')
    .set('Authorization', `Bearer ${OWNER_TOKEN}`);
  assert.equal(invalid.status, 400);

  const missing = await request(setup({ find: async () => null }))
    .get(`/api/tasks/${ID}/`)
    .set('Authorization', `Bearer ${OWNER_TOKEN}`);
  assert.equal(missing.status, 404);
});

test('repository failures become JSON 503 errors', async () => {
  const response = await request(setup({ list: async () => { throw new Error('database down'); } }))
    .get('/api/tasks/?runId=manual')
    .set('Authorization', `Bearer ${OWNER_TOKEN}`);
  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { error: 'database or service unavailable' });
});
