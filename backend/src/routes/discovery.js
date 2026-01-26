import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getTrendingServices, getRecommendedServices } from '../controllers/discovery.js';

const router = express.Router();

// GET /discover/trending - trending services
router.get('/trending', getTrendingServices);

// GET /discover/recommended - recommended services for current user
router.get('/recommended', authenticate, getRecommendedServices);

export default router;

