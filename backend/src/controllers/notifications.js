import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';
import { saveSubscription, removeSubscription } from '../services/pushNotificationService.js';

/**
 * Get all notifications for the current user
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unread_only = req.query.unread_only === 'true';
    const offset = (page - 1) * limit;

    const where = { user_id: userId };
    if (unread_only) {
      where.is_read = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.notifications.count({ where })
    ]);

    res.json({
      notifications: notifications.map(n => ({
        ...n,
        payload: n.payload ? JSON.parse(n.payload) : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await prisma.notifications.count({
      where: { user_id: userId, is_read: false }
    });
    res.json({ unread_count: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await prisma.notifications.updateMany({
      where: { id, user_id: userId },
      data: { is_read: true }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true }
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await prisma.notifications.deleteMany({
      where: { id, user_id: userId }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Save push subscription
 */
const savePushSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    const subscriptionId = await saveSubscription(userId, subscription);

    res.status(201).json({
      success: true,
      subscription_id: subscriptionId,
      message: 'Push subscription saved'
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Remove push subscription
 */
const removePushSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    await removeSubscription(userId, endpoint);

    res.json({ success: true, message: 'Push subscription removed' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get notification preferences
 */
const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await prisma.notification_preferences.findUnique({
      where: { user_id: userId }
    });

    if (!preferences) {
      // Return defaults
      return res.json({
        user_id: userId,
        messages_enabled: true,
        bookings_enabled: true,
        reviews_enabled: true,
        promotions_enabled: false,
        email_notifications: true,
        push_notifications: true
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update notification preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      messages_enabled,
      bookings_enabled,
      reviews_enabled,
      promotions_enabled,
      email_notifications,
      push_notifications
    } = req.body;

    const preferences = await prisma.notification_preferences.upsert({
      where: { user_id: userId },
      update: {
        messages_enabled: messages_enabled ?? undefined,
        bookings_enabled: bookings_enabled ?? undefined,
        reviews_enabled: reviews_enabled ?? undefined,
        promotions_enabled: promotions_enabled ?? undefined,
        email_notifications: email_notifications ?? undefined,
        push_notifications: push_notifications ?? undefined
      },
      create: {
        user_id: userId,
        messages_enabled: messages_enabled ?? true,
        bookings_enabled: bookings_enabled ?? true,
        reviews_enabled: reviews_enabled ?? true,
        promotions_enabled: promotions_enabled ?? false,
        email_notifications: email_notifications ?? true,
        push_notifications: push_notifications ?? true
      }
    });

    res.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  savePushSubscription,
  removePushSubscription,
  getPreferences,
  updatePreferences
};

