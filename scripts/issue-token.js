import dotenv from 'dotenv';
import { loadConfig } from '../src/config.js';
import { issueAccessToken } from '../src/security/jwt.js';

dotenv.config({ quiet: true });

const aliases = { creator: 'owner', owner: 'owner', reviewer: 'reviewer', teacher: 'reviewer' };
const role = aliases[process.argv[2]];
if (!role) {
  console.error('Usage: npm run token:issue -- owner|reviewer');
  process.exit(1);
}

const config = loadConfig();
const result = issueAccessToken(role, config.jwtSecret);
console.log(`Role: ${role}`);
console.log(`Expires at: ${result.expiresAt}`);
console.log(`Token: ${result.token}`);
