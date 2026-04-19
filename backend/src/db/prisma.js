import { PrismaClient } from '@prisma/client';

// Force-disable noisy Prisma debug logs if they are set in the environment
if (process.env.DEBUG && process.env.DEBUG.includes('prisma:query')) {
  process.env.DEBUG = process.env.DEBUG.replace('prisma:query', '').replace(',,', ',');
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
