import express from 'express';
import { optionalAuthenticate } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validation.js';
import { searchSchema, nearbySchema } from '../utils/validationSchemas.js';
import {
  searchServices,
  findNearbyServices,
  getCategories,
  getNeighborhoods,
  getCities
} from '../controllers/searchController.js';

const router = express.Router();

// Apply search rate limiting to all routes
router.use(searchLimiter);

// Optional authentication for personalized results
router.use(optionalAuthenticate);

// GET /search/services - Advanced service search
router.get('/services', validate(searchSchema, 'query'), searchServices);

// GET /search/nearby - Find services nearby
router.get('/nearby', validate(nearbySchema, 'query'), findNearbyServices);

// GET /search/categories - Get available categories
router.get('/categories', getCategories);

// GET /search/neighborhoods - Get neighborhoods
router.get('/neighborhoods', getNeighborhoods);

// GET /search/cities - Get cities
router.get('/cities', getCities);

export default router;

