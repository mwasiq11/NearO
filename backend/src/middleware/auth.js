import { verifyAccessToken } from '../utils/jwt.js';
import { pool } from '../db/database.js';

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

    // Fetch user from database to ensure they still exist and are active
    const [users] = await pool.execute(
      'SELECT id, email, role, is_active, is_verified, suspended_until FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'User account does not exist'
      });
    }

    const user = users[0];

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
      is_verified: user.is_verified
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
        const [users] = await pool.execute(
          'SELECT id, email, role, is_active, is_verified FROM users WHERE id = ? AND is_active = TRUE',
          [decoded.id]
        );

        if (users.length > 0) {
          const user = users[0];
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            is_verified: user.is_verified
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

export {
  authenticate,
  optionalAuthenticate,
  requireVerification
};

