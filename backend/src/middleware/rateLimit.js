import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000; // Convert minutes to ms
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'); // Increased from 500
const AUTH_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX || '50'); // Increased for development
const SEARCH_MAX = parseInt(process.env.SEARCH_RATE_LIMIT_MAX || '500'); // Increased from 200

/**
 * Global rate limiter - applies to all requests
 * More lenient for normal user activity
 */
const globalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(WINDOW_MS / 1000)
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated for better accuracy
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Skip rate limiting for certain read-only endpoints
    const skipPaths = [
      '/health',
      '/uploads',
    ];
    return skipPaths.some(path => req.path.startsWith(path));
  }
});

/**
 * Authentication rate limiter - stricter limits for login/register
 * Uses sliding window with more lenient limits for better UX
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (reduced from 1 hour for better UX)
  max: AUTH_MAX, // 20 attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count failed attempts
  keyGenerator: (req) => {
    // Use IP only (more forgiving than per-email limiting)
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: 900
    });
  }
});

/**
 * Search rate limiter - for location-based searches
 * More lenient for authenticated users
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: SEARCH_MAX,
  message: {
    error: 'Search limit exceeded',
    message: 'Too many search requests, please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Give authenticated users higher limits
    return req.user && req.method === 'GET';
  }
});

/**
 * Admin rate limiter - higher limits for admin users
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Higher limit for admins
  message: {
    error: 'Admin rate limit exceeded',
    message: 'Too many admin requests, please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for admin endpoints
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Only apply to admin routes
    return !req.user || !['admin', 'moderator'].includes(req.user.role);
  }
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Slightly increased from 3
  message: {
    error: 'Too many password reset requests',
    message: 'Too many password reset attempts, please try again after an hour.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email || req.ip || req.connection.remoteAddress;
  }
});

/**
 * Email verification rate limiter
 */
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Increased from 5
  message: {
    error: 'Too many verification requests',
    message: 'Too many email verification requests, please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email || req.query?.email || req.ip || req.connection.remoteAddress;
  }
});

/**
 * Read-only operations limiter - Very lenient for GET requests
 */
const readOnlyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute for reads
  message: {
    error: 'Too many read requests',
    message: 'Please slow down your requests.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Only apply to GET requests
    return req.method !== 'GET';
  }
});

/**
 * Create custom rate limiter
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate limiter middleware
 */
function createLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs || WINDOW_MS,
    max: options.max || MAX_REQUESTS,
    message: options.message || {
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || req.connection.remoteAddress),
    skip: options.skip || (() => false),
    skipSuccessfulRequests: options.skipSuccessfulRequests || false
  });
}

export {
  globalLimiter,
  authLimiter,
  searchLimiter,
  adminLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  readOnlyLimiter,
  createLimiter
};

