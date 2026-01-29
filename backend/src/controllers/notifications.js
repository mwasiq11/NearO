import { pool, readPool } from '../db/database.js';
import { saveSubscription, removeSubscription, removeAllSubscriptions } from '../services/pushNotificationService.js';

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

    let query = `SELECT * FROM notifications WHERE user_id = ?`;
    const params = [userId];

    if (unread_only) {
      query += ` AND is_read = FALSE`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log('📋 Notification query:', { query, params });

    const [notifications] = await readPool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`;
    const countParams = [userId];
    if (unread_only) {
      countQuery += ' AND is_read = FALSE';
    }
    const [countResult] = await readPool.execute(countQuery, countParams);
    const total = countResult[0].total;

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
    const [result] = await readPool.execute(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    res.json({ unread_count: result[0].count });
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

    const [result] = await pool.execute(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
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

    await pool.execute(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

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

    const [result] = await pool.execute(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
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

    const [prefs] = await readPool.execute(
      `SELECT * FROM notification_preferences WHERE user_id = ?`,
      [userId]
    );

    if (prefs.length === 0) {
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

    res.json(prefs[0]);
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

    // Check if preferences exist
    const [existing] = await pool.execute(
      `SELECT user_id FROM notification_preferences WHERE user_id = ?`,
      [userId]
    );

    if (existing.length === 0) {
      // Create new preferences
      await pool.execute(
        `INSERT INTO notification_preferences 
         (user_id, messages_enabled, bookings_enabled, reviews_enabled, promotions_enabled, email_notifications, push_notifications)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          messages_enabled !== undefined ? messages_enabled : true,
          bookings_enabled !== undefined ? bookings_enabled : true,
          reviews_enabled !== undefined ? reviews_enabled : true,
          promotions_enabled !== undefined ? promotions_enabled : false,
          email_notifications !== undefined ? email_notifications : true,
          push_notifications !== undefined ? push_notifications : true
        ]
      );
    } else {
      // Update existing preferences
      const updates = [];
      const values = [];

      if (messages_enabled !== undefined) {
        updates.push('messages_enabled = ?');
        values.push(messages_enabled);
      }
      if (bookings_enabled !== undefined) {
        updates.push('bookings_enabled = ?');
        values.push(bookings_enabled);
      }
      if (reviews_enabled !== undefined) {
        updates.push('reviews_enabled = ?');
        values.push(reviews_enabled);
      }
      if (promotions_enabled !== undefined) {
        updates.push('promotions_enabled = ?');
        values.push(promotions_enabled);
      }
      if (email_notifications !== undefined) {
        updates.push('email_notifications = ?');
        values.push(email_notifications);
      }
      if (push_notifications !== undefined) {
        updates.push('push_notifications = ?');
        values.push(push_notifications);
      }

      if (updates.length > 0) {
        values.push(userId);
        await pool.execute(
          `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
          values
        );
      }
    }

    // Return updated preferences
    const [updated] = await readPool.execute(
      `SELECT * FROM notification_preferences WHERE user_id = ?`,
      [userId]
    );

    res.json(updated[0]);
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

