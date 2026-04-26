import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  verifyOTP,
  resendOTP,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  googleAuth
} from '../controllers/authController.js';
import { passwordResetLimiter, emailVerificationLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validation.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../utils/validationSchemas.js';

const router = express.Router();

// POST /auth/register - Register new user
router.post('/register', validate(registerSchema), register);

// POST /auth/verify-otp - Verify OTP for new user sign-up
router.post('/verify-otp', emailVerificationLimiter, verifyOTP);

// POST /auth/resend-otp - Resend OTP for email verification
router.post('/resend-otp', emailVerificationLimiter, resendOTP);

// POST /auth/login - Login user (provider/seeker/moderator/admin)
router.post('/login', validate(loginSchema), login);

// POST /auth/refresh - Refresh access token
router.post('/refresh', refresh);

// POST /auth/google - Google authentication
router.post('/google', googleAuth);

// POST /auth/logout - Logout user
router.post('/logout', logout);

// GET /auth/verify-email - Verify email address (legacy - for password reset)
router.get('/verify-email', emailVerificationLimiter, verifyEmail);

// POST /auth/forgot-password - Request password reset
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);

// POST /auth/reset-password - Reset password
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

// POST /auth/change-password - Change password (for forced change)
// Protected by authenticate to ensure we have a valid (possibly restricted) session
import { authenticate } from '../middleware/auth.js';
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;

