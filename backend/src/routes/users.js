import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validation.js';
import { updateProfileSchema } from '../utils/validationSchemas.js';
import { createUser, getUsers, getMyProfile, updateMyProfile, uploadProfilePicture } from '../controllers/users.js';
import { getPreferences, updatePreferences } from '../controllers/userPreferences.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// GET /users - Get all users
router.get('/', getUsers);

// POST /users - Create a new user
router.post('/', createUser);

// GET /users/me - Get current user profile
router.get('/me', authenticate, requirePermission('profile.read'), getMyProfile);

// PUT /users/me - Update current user profile
router.put('/me', authenticate, requirePermission('profile.update'), validate(updateProfileSchema), updateMyProfile);

// POST /users/me/profile-picture - Upload profile picture
router.post('/me/profile-picture', authenticate, requirePermission('profile.update'), upload.single('file'), uploadProfilePicture);

// Preferences management
router.get('/me/preferences', authenticate, getPreferences);
router.put('/me/preferences', authenticate, updatePreferences);

export default router;
