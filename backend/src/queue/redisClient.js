import { createClient } from 'redis';

let client;
let isConnected = false;

function buildRedisOptions() {
  // Prefer REDIS_URL if provided
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL };
  }

  // Fallback to discrete config
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = Number(process.env.REDIS_PORT || 6379);
  const username = process.env.REDIS_USERNAME || undefined;
  const password = process.env.REDIS_PASSWORD || undefined;
  const useTLS = String(process.env.REDIS_TLS || '').toLowerCase() === 'true';

  const options = { socket: { host, port } };
  if (username) options.username = username;
  if (password) options.password = password;
  if (useTLS) options.socket.tls = true;

  return options;
}

async function getRedisClient() {
  const hasAnyConfig =
    !!process.env.REDIS_URL ||
    !!process.env.REDIS_HOST ||
    !!process.env.REDIS_PORT ||
    !!process.env.REDIS_PASSWORD ||
    !!process.env.REDIS_USERNAME;

  if (!hasAnyConfig) {
    return null;
  }

  if (client && isConnected) {
    return client;
  }

  client = createClient(buildRedisOptions());

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await client.connect();
  isConnected = true;
  return client;
}

export { getRedisClient };

