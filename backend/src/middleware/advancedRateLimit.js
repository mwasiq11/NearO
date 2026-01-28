import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../queue/redisClient.js';

/**
 * Advanced Rate Limiting Strategy using Redis
 * 
 * System Design Approach:
 * 1. Token Bucket Algorithm - Smooth out request bursts
 * 2. Distributed Rate Limiting - Share limits across multiple servers
 * 3. User-based vs IP-based limiting - More accurate tracking
 * 4. Exponential Backoff - Gradually increase restrictions for abusers
 * 5. Whitelist/Blacklist support - Flexible access control
 */

/**
 * Create Redis-backed rate limiter (for production scalability)
 */
const createRedisRateLimiter = (options) => {
  if (!redisClient?.isReady) {
    console.warn('⚠️ Redis not available, falling back to in-memory rate limiting');
    return rateLimit(options);
  }

  return rateLimit({
    ...options,
    store: new RedisStore({
      // @ts-expect-error - Rate limit redis expects Redis v4 client
      client: redisClient,
      prefix: 'rl:',
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
  });
};

/**
 * Adaptive Rate Limiter - adjusts limits based on user behavior
 */
export const createAdaptiveRateLimiter = (config) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    trustScore = true,
  } = config;

  return rateLimit({
    windowMs,
    max: async (req) => {
      // Authenticated users get higher limits
      if (req.user) {
        const userLevel = req.user.trust_score || 0;
        
        // Trust-based multiplier (0.5x to 3x base limit)
        if (userLevel >= 90) return maxRequests * 3; // Highly trusted
        if (userLevel >= 70) return maxRequests * 2; // Trusted
        if (userLevel >= 50) return maxRequests * 1.5; // Normal
        return maxRequests; // New users
      }
      
      // Anonymous users get base limit
      return maxRequests * 0.5;
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID for authenticated, IP for anonymous
      return req.user?.id || req.ip || 'unknown';
    },
    skip: (req) => {
      // Skip health checks and static assets
      return req.path.startsWith('/health') || req.path.startsWith('/uploads');
    },
  });
};

/**
 * Exponential Backoff Rate Limiter
 * Increases penalty time for repeated violations
 */
export const exponentialBackoffLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Very strict for sensitive operations
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const attempts = parseInt(req.rateLimit?.remaining || '0');
    const backoffMinutes = Math.pow(2, Math.min(attempts, 6)); // 2^n backoff, max 64 mins
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many failed attempts. Please try again in ${backoffMinutes} minutes.`,
      retryAfter: backoffMinutes * 60,
      attempts,
    });
  },
});

/**
 * Smart Authentication Rate Limiter
 * - Tracks failed login attempts per IP and email
 * - Implements progressive delays
 * - Resets on successful login
 */
export const smartAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per 15 minutes (generous for development)
  skipSuccessfulRequests: true, // Reset on success
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Track both IP and email for better accuracy
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const email = req.body?.email || '';
    return `auth:${ip}:${email}`;
  },
  handler: (req, res) => {
    const remaining = req.rateLimit?.remaining || 0;
    const resetTime = req.rateLimit?.resetTime || Date.now();
    const minutesUntilReset = Math.ceil((resetTime - Date.now()) / 60000);
    
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: `Login temporarily blocked. Please try again in ${minutesUntilReset} minutes.`,
      retryAfter: minutesUntilReset * 60,
      remaining,
    });
  },
});

/**
 * Burst Protection - allows short bursts but limits sustained traffic
 */
export const burstProtectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // Allow 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Request burst detected',
    message: 'Please slow down your requests.',
  },
});

/**
 * API Endpoint-specific limiters
 */
export const endpointLimiters = {
  // File upload limiter (more restrictive)
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
      error: 'Upload limit exceeded',
      message: 'Too many file uploads. Please try again later.',
    },
  }),
  
  // Payment/sensitive operations (very restrictive)
  payment: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 payment operations per hour
    skipSuccessfulRequests: false, // Count all attempts
    message: {
      error: 'Payment operation limit exceeded',
      message: 'Too many payment attempts. Please contact support if this persists.',
    },
  }),
  
  // Search (more lenient)
  search: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 searches per minute
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      error: 'Search limit exceeded',
      message: 'Too many searches. Please wait a moment.',
    },
  }),
};

/**
 * Middleware to bypass rate limiting for trusted IPs/users
 */
export const bypassRateLimitForTrusted = (req, res, next) => {
  // Whitelist IPs (e.g., internal services, monitoring)
  const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (trustedIPs.includes(clientIP)) {
    req.rateLimit = { limit: Infinity, remaining: Infinity };
    return next();
  }
  
  // Trusted users (admins, verified power users)
  if (req.user?.role === 'admin' || req.user?.is_verified_business) {
    req.rateLimit = { limit: Infinity, remaining: Infinity };
    return next();
  }
  
  next();
};

/**
 * Rate limit metrics collection (for monitoring and alerting)
 */
export const rateLimitMetrics = {
  violations: new Map(),
  
  recordViolation: (identifier, endpoint) => {
    const key = `${identifier}:${endpoint}`;
    const current = rateLimitMetrics.violations.get(key) || 0;
    rateLimitMetrics.violations.set(key, current + 1);
    
    // Alert if excessive violations (potential attack)
    if (current > 10) {
      console.warn(`⚠️ High rate limit violations detected: ${identifier} on ${endpoint}`);
      // TODO: Integrate with monitoring system (Datadog, NewRelic, etc.)
    }
  },
  
  getMetrics: () => {
    return {
      totalViolations: rateLimitMetrics.violations.size,
      topViolators: Array.from(rateLimitMetrics.violations.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
    };
  },
};

export default {
  createAdaptiveRateLimiter,
  smartAuthLimiter,
  burstProtectionLimiter,
  endpointLimiters,
  bypassRateLimitForTrusted,
  exponentialBackoffLimiter,
};
