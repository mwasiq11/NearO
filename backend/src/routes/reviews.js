import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createReviewSchema } from '../utils/validationSchemas.js';
import { createReview, listProviderReviews, getReputation } from '../controllers/reviews.js';

const router = express.Router();

// POST /reviews - create a review (requires auth)
router.post('/', authenticate, validate(createReviewSchema), createReview);

// GET /reviews/provider/:providerId - list reviews for a provider
router.get('/provider/:providerId', listProviderReviews);

// GET /reviews/reputation/:providerId - get reputation score for a provider
router.get('/reputation/:providerId', getReputation);

export default router;

