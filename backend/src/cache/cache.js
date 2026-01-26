import { getRedisClient } from '../queue/redisClient.js';

async function getOrSetCache(key, ttlSeconds, fetchFn) {
  const redis = await getRedisClient();
  if (!redis) {
    return fetchFn();
  }

  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const fresh = await fetchFn();
  await redis.setEx(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
}

async function invalidateCache(key) {
  const redis = await getRedisClient();
  if (!redis) return;
  await redis.del(key);
}

export {
  getOrSetCache,
  invalidateCache
};

