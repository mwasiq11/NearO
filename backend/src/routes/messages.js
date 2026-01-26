import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { listConversations, listMessages } from '../controllers/messages.js';

const router = express.Router();

// GET /messages/conversations - list conversations for current user
router.get('/conversations', authenticate, listConversations);

// GET /messages/:conversationId - list messages for a conversation
router.get('/:conversationId', authenticate, listMessages);

export default router;

