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
    console.log('ℹ️ Redis not configured, using in-memory fallback');
    return null;
  }

  if (client && isConnected) {
    return client;
  }

  try {
    client = createClient({
      ...buildRedisOptions(),
      socket: {
        ...buildRedisOptions().socket,
        connectTimeout: 10000, // 10 seconds
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('⚠️ Redis max retries reached, using in-memory fallback');
            return false; // Stop retrying
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    // Suppress repeated error messages
    let errorLogged = false;
    client.on('error', (err) => {
      if (!errorLogged) {
        console.warn('⚠️ Redis connection failed, using in-memory fallback');
        errorLogged = true;
        isConnected = false;
      }
    });

    await client.connect();
    isConnected = true;
    console.log('✅ Redis connected successfully');
    return client;
  } catch (error) {
    console.warn('⚠️ Redis unavailable, using in-memory fallback');
    isConnected = false;
    return null;
  }
}

export { getRedisClient };

