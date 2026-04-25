import { getRedisClient } from '../queue/redisClient.js';
import prisma from '../db/prisma.js';
import { sendPushNotification, createNotificationPayload } from '../services/pushNotificationService.js';
import { v4 as uuidv4 } from 'uuid';
import { getIO, onlineUsers } from '../realtime/socket.js';

let isRunning = false;
let subscriber = null;

/**
 * Create a notification record in the database
 */
async function createNotification(userId, type, payload) {
  const notificationId = uuidv4();
  await prisma.notifications.create({
    data: {
      id: notificationId,
      user_id: userId,
      type: type,
      payload: JSON.stringify(payload)
    }
  });
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
        title = `Message from ${otherData.senderName || 'Someone'}`;
        body = `Sent you a message: ${otherData.preview || '...'}`;
        notificationPayload = createNotificationPayload(
          'message',
          title,
          body,
          {
            conversationId,
            messageId,
            url: `/dashboard/messages?conversationId=${conversationId}`
          }
        );
        break;

      case 'booking_request':
        title = 'New Booking Request';
        body = `Request received for: ${otherData.serviceName || 'your service'}`;
        notificationPayload = createNotificationPayload(
          'booking',
          title,
          body,
          {
            bookingId: otherData.bookingId,
            url: `/dashboard/bookings/${otherData.bookingId}`
          }
        );
        break;

      case 'booking_approved':
        title = 'Booking Confirmed';
        body = `Great news! Your booking for ${otherData.serviceName || 'the service'} has been approved.`;
        notificationPayload = createNotificationPayload(
          'booking',
          title,
          body,
          {
            bookingId: otherData.bookingId,
            url: `/dashboard/bookings/${otherData.bookingId}`
          }
        );
        break;

      case 'review':
        title = 'New Review Received';
        body = `A customer has shared feedback on your service.`;
        notificationPayload = createNotificationPayload(
          'review',
          title,
          body,
          {
            reviewId: otherData.reviewId,
            url: `/dashboard/reviews/${otherData.reviewId}`
          }
        );
        break;

      default:
        title = otherData.title || 'Notification';
        body = otherData.message || 'You have a new update';
        notificationPayload = createNotificationPayload(
          type,
          title,
          body,
          otherData
        );
    }

    // Save notification to database with title and message in payload for persistence
    const notificationId = await createNotification(receiverId, type, {
      ...otherData,
      title,
      message: body,
      conversationId,
      messageId,
      entity_type: type.startsWith('booking') ? 'booking' : type === 'message' ? 'conversation' : type,
      entity_id: conversationId || otherData.bookingId || otherData.reviewId
    });

    // --- NEW: Real-time WebSocket Emission ---
    const io = getIO();
    if (io) {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('notification:received', {
          id: notificationId,
          user_id: receiverId,
          type: type,
          title: title,
          message: body,
          entity_type: type.startsWith('booking') ? 'booking' : type === 'message' ? 'conversation' : type,
          entity_id: conversationId || otherData.bookingId || otherData.reviewId,
          payload: {
            ...otherData,
            conversationId,
            messageId
          },
          is_read: false,
          created_at: new Date()
        });
      }
    }
    // -----------------------------------------

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

