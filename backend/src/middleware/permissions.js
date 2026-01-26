import { hasPermission, canPerformAction } from '../config/permissions.js';

/**
 * Middleware to require a specific permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    // Check if user has the permission
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `You don't have permission to perform this action. Required: ${permission}`,
        required: permission,
        currentRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to require one of multiple permissions
 * @param {Array<string>} permissions - Array of acceptable permissions
 * @returns {Function} Express middleware
 */
function requireAnyPermission(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required'
      });
    }

    const hasAnyPermission = permissions.some(permission => 
      hasPermission(req.user.role, permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `You need one of these permissions: ${permissions.join(', ')}`,
        required: permissions,
        currentRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to require all specified permissions
 * @param {Array<string>} permissions - Array of required permissions
 * @returns {Function} Express middleware
 */
function requireAllPermissions(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required'
      });
    }

    const hasAllPermissions = permissions.every(permission => 
      hasPermission(req.user.role, permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `You need all of these permissions: ${permissions.join(', ')}`,
        required: permissions,
        currentRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to require a specific role
 * @param {Array<string>} roles - Allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient role',
        message: `This action requires one of these roles: ${roles.join(', ')}`,
        required: roles,
        currentRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user can perform action on resource
 * This is useful for checking ownership before allowing actions
 * @param {string} permission - Required permission
 * @param {Function} getResourceOwnerId - Function to get resource owner ID from request
 * @returns {Function} Express middleware
 */
function requireResourcePermission(permission, getResourceOwnerId) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required'
      });
    }

    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      const canPerform = canPerformAction(req.user, permission, resourceOwnerId);

      if (!canPerform) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: 'You don\'t have permission to perform this action on this resource',
          required: permission,
          currentRole: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        error: 'Permission check failed',
        message: error.message
      });
    }
  };
}

export {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireResourcePermission
};

