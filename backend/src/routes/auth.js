import express from 'express';
import {
  register,
  login,
  moderatorLogin,
  adminLogin,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { passwordResetLimiter, emailVerificationLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validation.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../utils/validationSchemas.js';

const router = express.Router();

// POST /auth/register - Register new user
router.post('/register', validate(registerSchema), register);

// POST /auth/login - Login user (provider/seeker)
router.post('/login', validate(loginSchema), login);

// POST /auth/moderator-login - Login moderator
router.post('/moderator-login', validate(loginSchema), moderatorLogin);

// POST /auth/admin-login - Login admin
router.post('/admin-login', validate(loginSchema), adminLogin);

// POST /auth/refresh - Refresh access token
router.post('/refresh', refresh);

// POST /auth/logout - Logout user
router.post('/logout', logout);

// GET /auth/verify-email - Verify email address
router.get('/verify-email', emailVerificationLimiter, verifyEmail);

// POST /auth/forgot-password - Request password reset
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);

// POST /auth/reset-password - Reset password
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

export default router;

