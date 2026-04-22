import { defineConfig } from '@prisma/config';

// Node 20.6+: loads .env / .env.local from cwd so process.env is populated
// before Prisma resolves the datasource below.
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // fall through to .env
  }
  try {
    process.loadEnvFile();
  } catch {
    // no .env — assume env vars are already in the environment
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Put it in .env.local at the project root.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
