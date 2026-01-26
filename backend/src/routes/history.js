import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getHistory,
  getUserServiceHistory,
  getDashboardStats
} from '../controllers/historyController.js';

const router = express.Router();

// All endpoints require authentication
router.use(authenticate);

// GET /history - Get audit history (role-based access)
router.get('/', getHistory);

// GET /history/service - Get user service history (provider/seeker)
router.get('/service', getUserServiceHistory);

// GET /history/dashboard-stats - Get dashboard statistics (role-based)
router.get('/dashboard-stats', getDashboardStats);

export default router;
