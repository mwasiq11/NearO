import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNotifications, getUnreadCount, markNotificationAsRead, markAllAsRead } from '../controllers/notificationsController.js';

const router = express.Router();

// GET /notifications - Get notifications
router.get('/', authenticate, getNotifications);

// GET /notifications/unread-count - Get unread count
router.get('/unread-count', authenticate, getUnreadCount);

// PUT /notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticate, markNotificationAsRead);

// PUT /notifications/read-all - Mark all as read
router.put('/read-all', authenticate, markAllAsRead);

export default router;
