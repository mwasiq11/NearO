import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/permissions.js';
import { adminLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validation.js';
import {
  suspendUserSchema,
  warnUserSchema,
  banUserSchema,
  updateUserRoleSchema,
  updateServiceSchema,
  createCategorySchema,
  updateCategorySchema,
  systemSettingSchema,
  maintenanceModeSchema
} from '../utils/validationSchemas.js';
import {
  getAllUsers,
  getUserById,
  suspendUser,
  unsuspendUser,
  warnUser,
  banUser,
  updateUserRole,
  getPendingServices,
  getServiceByIdAdmin,
  updateServiceAny,
  deleteServiceAny,
  approveService,
  rejectService,
  getUserReports,
  updateReportStatus,
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  listModerators,
  promoteToModerator,
  demoteModerator,
  getAnalyticsDashboard,
  getAnalyticsUsers,
  getAnalyticsServices,
  getAnalyticsExport,
  getSystemConfig,
  updateSystemConfig,
  getSystemLogs,
  setMaintenanceMode
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and have higher rate limits
router.use(authenticate);
router.use(adminLimiter);

// User Management
router.get('/users', requirePermission('users.view'), getAllUsers);
router.get('/users/:id', requirePermission('users.view'), getUserById);
router.put('/users/:id/suspend', requirePermission('users.suspend'), validate(suspendUserSchema), suspendUser);
router.put('/users/:id/unsuspend', requirePermission('users.suspend'), unsuspendUser);
router.post('/users/:id/warn', requirePermission('users.warn'), validate(warnUserSchema), warnUser);
router.delete('/users/:id/ban', requirePermission('users.ban'), validate(banUserSchema), banUser);
router.put('/users/:id/role', requirePermission('moderators.manage'), validate(updateUserRoleSchema), updateUserRole);

// Service Moderation
router.get('/services/pending', requirePermission('services.moderate'), getPendingServices);
router.get('/services/:id', requirePermission('services.moderate'), getServiceByIdAdmin);
router.put('/services/:id', requirePermission('services.update_any'), validate(updateServiceSchema), updateServiceAny);
router.delete('/services/:id', requirePermission('services.delete_any'), deleteServiceAny);
router.put('/services/:id/approve', requirePermission('services.moderate'), approveService);
router.put('/services/:id/reject', requirePermission('services.moderate'), rejectService);

// Reports Management
router.get('/reports', requirePermission('reports.handle'), getUserReports);
router.put('/reports/:id', requirePermission('reports.handle'), updateReportStatus);

// Category Management (Admin only)
router.get('/categories', requirePermission('categories.manage'), listCategoriesAdmin);
router.post('/categories', requirePermission('categories.manage'), validate(createCategorySchema), createCategory);
router.put('/categories/:id', requirePermission('categories.manage'), validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', requirePermission('categories.manage'), deleteCategory);

// Moderator Management (Admin only)
router.get('/moderators', requirePermission('moderators.manage'), listModerators);
router.put('/moderators/:id/promote', requirePermission('moderators.manage'), promoteToModerator);
router.put('/moderators/:id/demote', requirePermission('moderators.manage'), demoteModerator);

// Analytics
router.get('/analytics/dashboard', requirePermission('analytics.view'), getAnalyticsDashboard);
router.get('/analytics/users', requirePermission('analytics.view'), getAnalyticsUsers);
router.get('/analytics/services', requirePermission('analytics.view'), getAnalyticsServices);
router.get('/analytics/export', requirePermission('analytics.export'), getAnalyticsExport);

// System
router.get('/system/config', requirePermission('system.config'), getSystemConfig);
router.put('/system/config', requirePermission('system.config'), validate(systemSettingSchema), updateSystemConfig);
router.get('/system/logs', requirePermission('system.logs'), getSystemLogs);
router.put('/system/maintenance', requirePermission('system.maintenance'), validate(maintenanceModeSchema), setMaintenanceMode);

export default router;

