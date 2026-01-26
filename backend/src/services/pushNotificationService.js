import webpush from 'web-push';
import { pool } from '../db/database.js';

// Initialize web-push with VAPID keys (should be in environment variables)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Get user's push subscriptions
 */
async function getUserSubscriptions(userId) {
  const [subscriptions] = await pool.execute(
    `SELECT endpoint, p256dh_key, auth_key FROM user_push_subscriptions WHERE user_id = ?`,
    [userId]
  );
  return subscriptions.map(sub => ({
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh_key,
      auth: sub.auth_key
    }
  }));
}

/**
 * Check if user has push notifications enabled
 */
async function isPushEnabled(userId) {
  const [prefs] = await pool.execute(
    `SELECT push_notifications FROM notification_preferences WHERE user_id = ?`,
    [userId]
  );
  if (prefs.length === 0) {
    // Default to enabled if no preferences set
    return true;
  }
  return prefs[0].push_notifications === 1 || prefs[0].push_notifications === true;
}

/**
 * Send push notification to a user
 */
async function sendPushNotification(userId, notification) {
  try {
    // Check if push is enabled for user
    const pushEnabled = await isPushEnabled(userId);
    if (!pushEnabled) {
      console.log(`Push notifications disabled for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    // Get user's subscriptions
    const subscriptions = await getUserSubscriptions(userId);
    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Send to all subscriptions
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(notification)
        );
        sent++;
      } catch (error) {
        console.error(`Failed to send push notification:`, error);
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await removeSubscription(userId, subscription.endpoint);
        }
        failed++;
      }
    });

    await Promise.allSettled(promises);
    return { sent, failed };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { sent: 0, failed: 0, error: error.message };
  }
}

/**
 * Save push subscription for a user
 */
async function saveSubscription(userId, subscription) {
  const { v4: uuidv4 } = await import('uuid');
  const subscriptionId = uuidv4();

  await pool.execute(
    `INSERT INTO user_push_subscriptions (id, user_id, endpoint, p256dh_key, auth_key)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE p256dh_key = VALUES(p256dh_key), auth_key = VALUES(auth_key)`,
    [
      subscriptionId,
      userId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth
    ]
  );

  return subscriptionId;
}

/**
 * Remove push subscription
 */
async function removeSubscription(userId, endpoint) {
  await pool.execute(
    `DELETE FROM user_push_subscriptions WHERE user_id = ? AND endpoint = ?`,
    [userId, endpoint]
  );
}

/**
 * Remove all subscriptions for a user
 */
async function removeAllSubscriptions(userId) {
  await pool.execute(
    `DELETE FROM user_push_subscriptions WHERE user_id = ?`,
    [userId]
  );
}

/**
 * Create notification payload
 */
function createNotificationPayload(type, title, body, data = {}) {
  return {
    title,
    body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    data: {
      type,
      ...data
    },
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || type
  };
}

export {
  sendPushNotification,
  saveSubscription,
  removeSubscription,
  removeAllSubscriptions,
  createNotificationPayload,
  getUserSubscriptions,
  isPushEnabled
};

