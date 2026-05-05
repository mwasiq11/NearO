import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../db/prisma.js';

/**
 * Authentication middleware - verifies JWT token
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: 'Please login again'
      });
    }

    // Check for restricted scope (Forced Password Change phase)
    // Only allow /auth/change-password if token has PASSWORD_CHANGE_ONLY scope
    const isChangePasswordRoute = req.originalUrl.endsWith('/auth/change-password') || req.originalUrl.includes('/auth/change-password?');
    if (decoded.scope === 'PASSWORD_CHANGE_ONLY' && !isChangePasswordRoute) {
      return res.status(403).json({
        error: 'Password change required',
        message: 'Your current session is restricted. Please change your password to continue.',
        status: 'PASSWORD_CHANGE_REQUIRED'
      });
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
        is_verified: true,
        suspended_until: true,
        latitude: true,
        longitude: true,
        city: true,
        neighborhood: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'User account does not exist'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Account suspended',
        message: 'Your account has been suspended'
      });
    }

    // Check if account is suspended
    if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
      return res.status(403).json({ 
        error: 'Account temporarily suspended',
        message: `Your account is suspended until ${user.suspended_until}`
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      latitude: user.latitude,
      longitude: user.longitude,
      city: user.city,
      neighborhood: user.neighborhood
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work with or without authentication
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      if (decoded) {
        const user = await prisma.users.findUnique({
          where: { id: decoded.id, is_active: true },
          select: { id: true, email: true, role: true, is_verified: true, latitude: true, longitude: true, city: true, neighborhood: true }
        });

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            is_verified: user.is_verified,
            latitude: user.latitude,
            longitude: user.longitude,
            city: user.city,
            neighborhood: user.neighborhood
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors, just continue without user
    next();
  }
}

/**
 * Require email verification
 */
function requireVerification(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required'
    });
  }

  if (!req.user.is_verified) {
    return res.status(403).json({ 
      error: 'Email verification required',
      message: 'Please verify your email address to access this feature'
    });
  }

  next();
}

/**
 * Require specific role(s)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: `Only ${allowedRoles.join(' or ')} can access this resource`
      });
    }

    next();
  };
}

/**
 * Require admin role (prevents moderator access)
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Unauthorized',
      message: 'Only admins can access this resource'
    });
  }

  next();
}

/**
 * Require moderator or admin role
 */
function requireModeration(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required'
    });
  }

  if (!['moderator', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Unauthorized',
      message: 'Only moderators and admins can access this resource'
    });
  }

  next();
}

export {
  authenticate,
  optionalAuthenticate,
  requireVerification,
  requireRole,
  requireAdmin,
  requireModeration
};

