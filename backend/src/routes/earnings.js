import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProviderEarnings, getSeekerSpending } from '../controllers/earnings.js';

const router = express.Router();

// Get provider earnings (requires authentication)
router.get('/provider', authenticate, getProviderEarnings);

// Get seeker spending (requires authentication)
router.get('/seeker', authenticate, getSeekerSpending);

export default router;
