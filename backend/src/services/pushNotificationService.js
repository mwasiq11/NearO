import webpush from 'web-push';
import prisma from '../db/prisma.js';
import { v4 as uuidv4 } from 'uuid';

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
  const subscriptions = await prisma.user_push_subscriptions.findMany({
    where: { user_id: userId },
    select: { endpoint: true, p256dh_key: true, auth_key: true }
  });

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
  const prefs = await prisma.notification_preferences.findUnique({
    where: { user_id: userId },
    select: { push_notifications: true }
  });

  if (!prefs) {
    // Default to enabled if no preferences set
    return true;
  }
  return prefs.push_notifications === true;
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
  // We'll use findFirst/create pattern since endpoint might not be uniquely indexed in Prisma 
  // but logically it should be unique per user.
  const existing = await prisma.user_push_subscriptions.findFirst({
    where: { user_id: userId, endpoint: subscription.endpoint }
  });

  if (existing) {
    await prisma.user_push_subscriptions.update({
      where: { id: existing.id },
      data: {
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth
      }
    });
    return existing.id;
  } else {
    const id = uuidv4();
    await prisma.user_push_subscriptions.create({
      data: {
        id,
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth
      }
    });
    return id;
  }
}

/**
 * Remove push subscription
 */
async function removeSubscription(userId, endpoint) {
  await prisma.user_push_subscriptions.deleteMany({
    where: { user_id: userId, endpoint: endpoint }
  });
}

/**
 * Remove all subscriptions for a user
 */
async function removeAllSubscriptions(userId) {
  await prisma.user_push_subscriptions.deleteMany({
    where: { user_id: userId }
  });
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

