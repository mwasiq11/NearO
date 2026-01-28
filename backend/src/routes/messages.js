import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { listConversations, listMessages, sendMessage, markAsRead } from '../controllers/messages.js';

const router = express.Router();

// GET /messages/conversations - list conversations for current user
router.get('/conversations', authenticate, listConversations);

// GET /messages/:conversationId - list messages for a conversation
router.get('/:conversationId', authenticate, listMessages);

// POST /messages/send - send a message (with optional file)
router.post('/send', authenticate, uploadSingle, sendMessage);

// PUT /messages/:messageId/read - mark message as read
router.put('/:messageId/read', authenticate, markAsRead);

export default router;

