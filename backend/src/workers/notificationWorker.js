import { getRedisClient } from '../queue/redisClient.js';
import { pool } from '../db/database.js';
import { sendPushNotification, createNotificationPayload } from '../services/pushNotificationService.js';
import { v4 as uuidv4 } from 'uuid';

let isRunning = false;
let subscriber = null;

/**
 * Create a notification record in the database
 */
async function createNotification(userId, type, payload) {
  const notificationId = uuidv4();
  await pool.execute(
    `INSERT INTO notifications (id, user_id, type, payload)
     VALUES (?, ?, ?, ?)`,
    [notificationId, userId, type, JSON.stringify(payload)]
  );
  return notificationId;
}

/**
 * Process a notification message from Redis
 */
async function processNotification(message) {
  try {
    const data = JSON.parse(message);
    const { type, receiverId, conversationId, messageId, ...otherData } = data;

    // Create notification payload based on type
    let notificationPayload;
    let title;
    let body;

    switch (type) {
      case 'message':
        title = 'New Message';
        body = otherData.senderName 
          ? `${otherData.senderName} sent you a message`
          : 'You have a new message';
        notificationPayload = createNotificationPayload(
          'message',
          title,
          body,
          {
            conversationId,
            messageId,
            url: `/messages/${conversationId}`
          }
        );
        break;

      case 'booking_request':
        title = 'New Booking Request';
        body = `You have a new booking request for ${otherData.serviceName || 'a service'}`;
        notificationPayload = createNotificationPayload(
          'booking',
          title,
          body,
          {
            bookingId: otherData.bookingId,
            url: `/bookings/${otherData.bookingId}`
          }
        );
        break;

      case 'booking_approved':
        title = 'Booking Approved';
        body = `Your booking request has been approved`;
        notificationPayload = createNotificationPayload(
          'booking',
          title,
          body,
          {
            bookingId: otherData.bookingId,
            url: `/bookings/${otherData.bookingId}`
          }
        );
        break;

      case 'review':
        title = 'New Review';
        body = `You received a new review`;
        notificationPayload = createNotificationPayload(
          'review',
          title,
          body,
          {
            reviewId: otherData.reviewId,
            url: `/reviews/${otherData.reviewId}`
          }
        );
        break;

      default:
        title = 'New Notification';
        body = otherData.message || 'You have a new notification';
        notificationPayload = createNotificationPayload(
          type,
          title,
          body,
          otherData
        );
    }

    // Save notification to database
    await createNotification(receiverId, type, {
      ...otherData,
      conversationId,
      messageId
    });

    // Send push notification
    await sendPushNotification(receiverId, notificationPayload);

    console.log(`✅ Processed ${type} notification for user ${receiverId}`);
  } catch (error) {
    console.error('❌ Error processing notification:', error);
  }
}

/**
 * Start the notification worker
 */
async function startNotificationWorker() {
  if (isRunning) {
    console.log('⚠️  Notification worker is already running');
    return;
  }

  try {
    const redis = await getRedisClient();
    if (!redis) {
      console.log('⚠️  Redis not available, notification worker not started');
      return;
    }

    subscriber = redis.duplicate();
    await subscriber.connect();

    await subscriber.subscribe('notifications', (message) => {
      processNotification(message);
    });

    isRunning = true;
    console.log('✅ Notification worker started and listening for messages');
  } catch (error) {
    console.error('❌ Failed to start notification worker:', error);
    isRunning = false;
  }
}

/**
 * Stop the notification worker
 */
async function stopNotificationWorker() {
  if (!isRunning) {
    return;
  }

  try {
    if (subscriber) {
      await subscriber.unsubscribe('notifications');
      await subscriber.quit();
      subscriber = null;
    }
    isRunning = false;
    console.log('✅ Notification worker stopped');
  } catch (error) {
    console.error('❌ Error stopping notification worker:', error);
  }
}

export { startNotificationWorker, stopNotificationWorker, processNotification, createNotification };

