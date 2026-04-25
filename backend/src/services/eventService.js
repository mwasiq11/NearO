import { getRedisClient } from '../queue/redisClient.js';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';
import { getIO, onlineUsers } from '../realtime/socket.js';

const buildNotificationPresentation = (type, data = {}) => {
  switch (type) {
    case 'message': {
      const senderName = data.senderName || 'Someone';
      return {
        title: `Message from ${senderName}`,
        message: data.preview ? `Sent you a message: ${data.preview}` : 'Sent you a new message',
        entityType: 'conversation',
        entityId: data.conversationId,
      };
    }
    case 'booking_request':
      return {
        title: 'New Booking Request',
        message: `Request received for: ${data.serviceName || 'your service'}`,
        entityType: 'booking',
        entityId: data.bookingId,
      };
    case 'booking_approved':
      return {
        title: 'Booking Confirmed',
        message: `Great news! Your booking for ${data.serviceName || 'the service'} has been approved.`,
        entityType: 'booking',
        entityId: data.bookingId,
      };
    case 'booking_rejected':
      return {
        title: 'Booking Declined',
        message: `Your booking for ${data.serviceName || 'the service'} was declined.`,
        entityType: 'booking',
        entityId: data.bookingId,
      };
    default:
      return {
        title: data.title || 'Notification',
        message: data.message || 'You have a new update',
        entityType: type,
        entityId: data.entityId,
      };
  }
};

/**
 * Publish a notification event to Redis for processing by the worker
 */
export async function publishNotification(receiverId, type, data = {}) {
  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.publish('notifications', JSON.stringify({
        receiverId,
        type,
        ...data,
        created_at: new Date().toISOString()
      }));
      return true;
    }

    // Fallback when Redis worker is unavailable: persist and emit directly.
    console.warn('⚠️ Redis not available, using direct notification fallback');

    const presentation = buildNotificationPresentation(type, data);
    const payload = {
      ...data,
      title: presentation.title,
      message: presentation.message,
      entity_type: presentation.entityType,
      entity_id: presentation.entityId,
    };

    const notificationId = uuidv4();
    await prisma.notifications.create({
      data: {
        id: notificationId,
        user_id: receiverId,
        type,
        payload,
      },
    });

    const io = getIO();
    const receiverSocketId = onlineUsers.get(receiverId);
    if (io && receiverSocketId) {
      io.to(receiverSocketId).emit('notification:received', {
        id: notificationId,
        user_id: receiverId,
        type,
        title: presentation.title,
        message: presentation.message,
        entity_type: presentation.entityType,
        entity_id: presentation.entityId,
        payload,
        is_read: false,
        created_at: new Date(),
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to publish notification to Redis:', error);
    return false;
  }
}
