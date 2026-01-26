import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validation.js';
import { updateProfileSchema } from '../utils/validationSchemas.js';
import { createUser, getUsers, getMyProfile, updateMyProfile } from '../controllers/users.js';

const router = express.Router();

// GET /users - Get all users
router.get('/', getUsers);

// POST /users - Create a new user
router.post('/', createUser);

// GET /users/me - Get current user profile
router.get('/me', authenticate, requirePermission('profile.read'), getMyProfile);

// PUT /users/me - Update current user profile
router.put('/me', authenticate, requirePermission('profile.update'), validate(updateProfileSchema), updateMyProfile);

export default router;
