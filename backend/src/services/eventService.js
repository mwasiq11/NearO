import { getRedisClient } from '../queue/redisClient.js';

/**
 * Publish a notification event to Redis for processing by the worker
 */
export async function publishNotification(receiverId, type, data = {}) {
  try {
    const redis = await getRedisClient();
    if (!redis) {
      console.warn('⚠️ Redis not available, notification not published to queue');
      return false;
    }

    await redis.publish('notifications', JSON.stringify({
      receiverId,
      type,
      ...data,
      created_at: new Date().toISOString()
    }));
    
    return true;
  } catch (error) {
    console.error('❌ Failed to publish notification to Redis:', error);
    return false;
  }
}
