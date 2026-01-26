/**
 * Role-Based Access Control (RBAC) Permission Definitions
 * Hierarchical permissions: Admin > Moderator > User
 */

// User permissions (base level)
const USER_PERMISSIONS = {
  // Profile Management
  'profile.read': true,
  'profile.update': true,

  // Service Management (if they're providers)
  'services.create': true,
  'services.update_own': true,
  'services.delete_own': true,
  'services.read': true,

  // Booking Management
  'bookings.create': true,
  'bookings.update_own': true,
  'bookings.cancel_own': true,
  'bookings.read_own': true,

  // Reviews & Ratings
  'reviews.create': true,
  'reviews.update_own': true,

  // Location Services
  'location.search': true,
};

// Moderator permissions (includes all user permissions)
const MODERATOR_PERMISSIONS = {
  ...USER_PERMISSIONS,

  // Content Moderation
  'services.moderate': true,
  'services.update_any': true,
  'services.delete_any': true,

  'reviews.moderate': true,
  'reports.handle': true,

  // User Management
  'users.view': true,
  'users.suspend': true,
  'users.warn': true,

  // Analytics
  'analytics.view': true,
};

// Admin permissions (includes all moderator permissions)
const ADMIN_PERMISSIONS = {
  ...MODERATOR_PERMISSIONS,

  // System Administration
  'system.config': true,
  'moderators.manage': true,
  'categories.manage': true,

  // Advanced Analytics
  'analytics.export': true,
  'system.logs': true,

  // Emergency Controls
  'system.maintenance': true,
  'users.ban': true,
};

/**
 * Get permissions for a role
 * @param {string} role - User role
 * @returns {Object} Permissions object
 */
function getRolePermissions(role) {
  switch (role) {
    case 'admin':
      return ADMIN_PERMISSIONS;
    case 'moderator':
      return MODERATOR_PERMISSIONS;
    case 'user':
    default:
      return USER_PERMISSIONS;
  }
}

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
function hasPermission(role, permission) {
  const permissions = getRolePermissions(role);
  return permissions[permission] === true;
}

/**
 * Check if user can perform action on resource
 * @param {Object} user - User object with role
 * @param {string} permission - Required permission
 * @param {string} resourceOwnerId - ID of resource owner (for own resource checks)
 * @returns {boolean} True if user can perform action
 */
function canPerformAction(user, permission, resourceOwnerId = null) {
  // Check if user has the permission
  if (!hasPermission(user.role, permission)) {
    return false;
  }

  // For "own" resource permissions, check if user owns the resource
  if (permission.includes('_own') && resourceOwnerId) {
    return user.id === resourceOwnerId;
  }

  // For "any" permissions, check role level
  if (permission.includes('_any')) {
    return ['moderator', 'admin'].includes(user.role);
  }

  return true;
}

export {
  USER_PERMISSIONS,
  MODERATOR_PERMISSIONS,
  ADMIN_PERMISSIONS,
  getRolePermissions,
  hasPermission,
  canPerformAction
};

