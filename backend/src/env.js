import dotenv from 'dotenv';
dotenv.config();

// Force-disable noisy Prisma debug logs
if (process.env.DEBUG && process.env.DEBUG.includes('prisma:query')) {
  process.env.DEBUG = process.env.DEBUG.replace('prisma:query', '').replace(',,', ',');
}
if (!process.env.DEBUG || process.env.DEBUG === ',') {
  delete process.env.DEBUG;
}
