import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  savePushSubscription,
  removePushSubscription,
  getPreferences,
  updatePreferences
} from '../controllers/notifications.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Notification management
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

// Push subscription management
router.post('/subscriptions', savePushSubscription);
router.delete('/subscriptions', removePushSubscription);

// Notification preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;

