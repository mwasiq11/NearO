import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import prisma from '../db/prisma.js';
import { normalizeLocation } from '../utils/location.js';
import { invalidateCache } from '../cache/cache.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';
import { getIO } from '../realtime/socket.js';

async function logAdminAction(action, actorId, targetType = null, targetId = null, metadata = null, req = null) {
  try {
    await prisma.admin_action_logs.create({
      data: {
        id: uuidv4(),
        action,
        actor_id: actorId,
        target_type: targetType,
        target_id: targetId,
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null
      }
    });
    if (req) {
      const ctx = buildRequestContext(req);
      await logAudit({
        actorId,
        actionType: action,
        entityType: targetType || 'system',
        entityId: targetId,
        newValue: metadata || null,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent
      });
    }
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Get all users (admin/moderator only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, is_active, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_active: true,
          is_verified: true,
          created_at: true,
          last_login_at: true
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.users.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user details
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        is_verified: true,
        created_at: true,
        last_login_at: true,
        suspended_until: true,
        suspension_reason: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const warnings = await prisma.user_warnings.findMany({
      where: { user_id: id },
      orderBy: { created_at: 'desc' }
    });

    res.json({ user, warnings });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Suspend a user
 */
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration_hours, reason } = req.body;

    if (!duration_hours || duration_hours <= 0) {
      return res.status(400).json({ error: 'Valid suspension duration is required' });
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent suspending admins (unless current user is also admin)
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot suspend admin users' });
    }

    // Calculate suspension end time
    const suspendedUntil = new Date();
    suspendedUntil.setHours(suspendedUntil.getHours() + parseInt(duration_hours));

    await prisma.users.update({
      where: { id },
      data: {
        is_active: false,
        suspended_until: suspendedUntil,
        suspension_reason: reason || 'Suspended by moderator'
      }
    });

    res.json({ 
      message: 'User suspended successfully',
      suspended_until: suspendedUntil
    });

    // Notify moderators/admins
    getIO()?.to('moderation').emit('user:suspended', { userId: id, actorId: req.user.id });

    await logAdminAction('user_suspend', req.user.id, 'user', id, {
      duration_hours: duration_hours,
      reason: reason || 'Suspended by moderator'
    }, req);
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Unsuspend a user
 */
const unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.users.update({
      where: { id },
      data: {
        is_active: true,
        suspended_until: null,
        suspension_reason: null
      }
    });

    res.json({ message: 'User unsuspended successfully' });

    // Notify moderators/admins
    getIO()?.to('moderation').emit('user:unsuspended', { userId: id, actorId: req.user.id });

    await logAdminAction('user_unsuspend', req.user.id, 'user', id, null, req);
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Warn a user
 */
const warnUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const warningId = uuidv4();
    await prisma.user_warnings.create({
      data: {
        id: warningId,
        user_id: id,
        warned_by: req.user.id,
        reason
      }
    });

    res.status(201).json({ message: 'User warned successfully' });

    await logAdminAction('user_warn', req.user.id, 'user', id, { reason }, req);
  } catch (error) {
    console.error('Error warning user:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Ban a user (admin only)
 */
const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot ban admin users' });
    }

    await prisma.users.update({
      where: { id },
      data: {
        is_active: false,
        suspended_until: null,
        suspension_reason: reason ? `Banned: ${reason}` : 'Banned by admin'
      }
    });

    res.json({ message: 'User banned successfully' });

    await logAdminAction('user_ban', req.user.id, 'user', id, { reason: reason || null }, req);
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update user role (admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.users.update({
      where: { id },
      data: { role }
    });

    res.json({ message: 'User role updated successfully' });

    await logAdminAction('user_role_update', req.user.id, 'user', id, { role }, req);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get pending services for moderation
 */
const getPendingServices = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      prisma.services.findMany({
        where: { moderated_at: null },
        include: {
          users_services_provider_idTousers: {
            select: { name: true, email: true }
          }
        },
        orderBy: { created_at: 'asc' },
        skip: offset,
        take: limitNum
      }),
      prisma.services.count({ where: { moderated_at: null } })
    ]);

    const mappedServices = services.map(s => ({
      ...s,
      provider_name: s.users_services_provider_idTousers.name,
      provider_email: s.users_services_provider_idTousers.email
    }));

    res.json({
      services: mappedServices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting pending services:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get service details (admin/moderator)
 */
const getServiceByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.services.findUnique({
      where: { id },
      include: {
        users_services_provider_idTousers: {
          select: { name: true, email: true }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      ...service,
      provider_name: service.users_services_provider_idTousers.name,
      provider_email: service.users_services_provider_idTousers.email
    });
  } catch (error) {
    console.error('Error getting service details:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update any service (admin/moderator)
 */
const updateServiceAny = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      price,
      availability,
      latitude,
      longitude,
      neighborhood,
      city,
      is_active
    } = req.body;

    const service = await prisma.services.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (availability !== undefined) updateData.availability = availability;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
    if (city !== undefined) updateData.city = city;

    if (latitude !== undefined || longitude !== undefined) {
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Both latitude and longitude are required for location updates' });
      }
      const locationData = normalizeLocation({ latitude, longitude, neighborhood, city });
      if (!locationData) {
        return res.status(400).json({ error: 'Invalid location data' });
      }
      updateData.latitude = locationData.latitude;
      updateData.longitude = locationData.longitude;
      updateData.s2_cell_id = locationData.s2_cell_id ? locationData.s2_cell_id.toString() : null;
      updateData.neighborhood = locationData.neighborhood;
      updateData.city = locationData.city;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = await prisma.services.update({
      where: { id },
      data: updateData
    });

    res.json(updated);

    await logAdminAction('service_update_any', req.user.id, 'service', id, {
      fields: Object.keys(updateData)
    }, req);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete any service (admin/moderator)
 */
const deleteServiceAny = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.services.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await prisma.services.delete({
      where: { id }
    });

    res.json({ message: 'Service deleted successfully' });

    await logAdminAction('service_delete_any', req.user.id, 'service', id, null, req);
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Approve a service
 */
const approveService = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.services.update({
      where: { id },
      data: {
        moderated_at: new Date(),
        moderated_by: req.user.id,
        is_active: true
      }
    });

    res.json({ message: 'Service approved successfully' });

    // Notify moderators/admins and the owner
    const io = getIO();
    if (io) {
      io.to('moderation').emit('service:approved', { serviceId: id, actorId: req.user.id });
    }

    await logAdminAction('service_approve', req.user.id, 'service', id, null, req);
  } catch (error) {
    console.error('Error approving service:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reject a service
 */
const rejectService = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await prisma.services.update({
      where: { id },
      data: {
        moderated_at: new Date(),
        moderated_by: req.user.id,
        is_active: false
      }
    });

    res.json({ message: 'Service rejected successfully' });

    // Notify moderators/admins
    getIO()?.to('moderation').emit('service:rejected', { serviceId: id, actorId: req.user.id });

    await logAdminAction('service_reject', req.user.id, 'service', id, { reason: reason || null }, req);
  } catch (error) {
    console.error('Error rejecting service:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user reports
 */
const getUserReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.user_reports.findMany({
        where,
        include: {
          users_user_reports_reported_user_idTousers: { select: { name: true } },
          users_user_reports_reported_byTousers: { select: { name: true } },
          users_user_reports_reviewed_byTousers: { select: { name: true } }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.user_reports.count({ where })
    ]);

    const mappedReports = reports.map(r => ({
      ...r,
      reported_user_name: r.users_user_reports_reported_user_idTousers?.name,
      reporter_name: r.users_user_reports_reported_byTousers?.name,
      reviewer_name: r.users_user_reports_reviewed_byTousers?.name
    }));

    res.json({
      reports: mappedReports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting user reports:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update report status
 */
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await prisma.user_reports.update({
      where: { id },
      data: {
        status,
        reviewed_by: req.user.id,
        reviewed_at: new Date()
      }
    });

    res.json({ message: 'Report status updated successfully' });

    // Notify moderators/admins
    getIO()?.to('moderation').emit('report:updated', { reportId: id, status, actorId: req.user.id });

    await logAdminAction('report_status_update', req.user.id, 'report', id, { status }, req);
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Category management
 */
const listCategoriesAdmin = async (req, res) => {
  try {
    const { include_inactive } = req.query;
    const where = {};
    if (!include_inactive) {
      where.is_active = true;
    }

    const categories = await prisma.service_categories.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({ error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const id = uuidv4();

    const category = await prisma.service_categories.create({
      data: {
        id,
        name,
        description: description || null
      }
    });

    res.status(201).json(category);

    await logAdminAction('category_create', req.user.id, 'category', id, { name }, req);
    await invalidateCache('cache:categories:active');
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const category = await prisma.service_categories.update({
      where: { id },
      data: updateData
    });

    res.json(category);

    await logAdminAction('category_update', req.user.id, 'category', id, {
      fields: Object.keys(updateData)
    }, req);
    await invalidateCache('cache:categories:active');
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.service_categories.update({
      where: { id },
      data: { is_active: false }
    });
    res.json({ message: 'Category deactivated successfully' });

    await logAdminAction('category_deactivate', req.user.id, 'category', id, null, req);
    await invalidateCache('cache:categories:active');
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Moderator management
 */
const createModerator = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true, role: true }
    });

    if (existingUser) {
      // User exists - promote them to moderator
      if (existingUser.role === 'admin') {
        return res.status(400).json({ error: 'Cannot modify admin users' });
      }

      if (existingUser.role === 'moderator') {
        return res.status(400).json({ error: 'User is already a moderator' });
      }

      // Promote existing user to moderator
      await prisma.users.update({
        where: { id: existingUser.id },
        data: { role: 'moderator', is_verified: true }
      });

      await logAdminAction('moderator_promote', req.user.id, 'user', existingUser.id, null, req);

      res.status(200).json({
        id: existingUser.id,
        name,
        email,
        role: 'moderator',
        message: 'User promoted to moderator successfully'
      });
    } else {
      // User doesn't exist - create new moderator
      if (!password) {
        return res.status(400).json({ error: 'Password is required for new moderators' });
      }

      // Generate UUID and hash password
      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create moderator with verified status
      await prisma.users.create({
        data: {
          id,
          name,
          email,
          password: hashedPassword,
          role: 'moderator',
          is_active: true,
          is_verified: true
        }
      });

      await logAdminAction('moderator_create', req.user.id, 'user', id, null, req);

      res.status(201).json({
        id,
        name,
        email,
        role: 'moderator',
        message: 'Moderator created successfully'
      });
    }
  } catch (error) {
    console.error('Error creating/promoting moderator:', error);
    res.status(500).json({ error: error.message });
  }
};

const listModerators = async (req, res) => {
  try {
    const moderators = await prisma.users.findMany({
      where: {
        role: { in: ['moderator', 'admin'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ moderators });
  } catch (error) {
    console.error('Error listing moderators:', error);
    res.status(500).json({ error: error.message });
  }
};

const promoteToModerator = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.users.update({
      where: { id },
      data: { role: 'moderator' }
    });
    res.json({ message: 'User promoted to moderator' });

    await logAdminAction('moderator_promote', req.user.id, 'user', id, null, req);
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ error: error.message });
  }
};

const demoteModerator = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({
      where: { id },
      select: { role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot demote admin user' });
    }

    await prisma.users.update({
      where: { id },
      data: { role: 'user' }
    });
    res.json({ message: 'Moderator demoted to user' });

    await logAdminAction('moderator_demote', req.user.id, 'user', id, null, req);
  } catch (error) {
    console.error('Error demoting moderator:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Analytics endpoints
 */
const getAnalyticsDashboard = async (req, res) => {
  try {
    const [userCounts, serviceCounts, reportCounts] = await Promise.all([
      prisma.users.aggregate({
        _count: { _all: true }
      }),
      prisma.services.aggregate({
        _count: { _all: true }
      }),
      prisma.user_reports.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ]);

    // Role-specific counts for users
    const [roleCounts] = await Promise.all([
      prisma.users.groupBy({
        by: ['role'],
        _count: { _all: true }
      })
    ]);

    const formattedUserCounts = {
      total: userCounts._count._all,
      users: roleCounts.find(r => r.role === 'user')?._count._all || 0,
      moderators: roleCounts.find(r => r.role === 'moderator')?._count._all || 0,
      admins: roleCounts.find(r => r.role === 'admin')?._count._all || 0,
      active_users: 0
    };
    
    // Accurate active user count
    formattedUserCounts.active_users = await prisma.users.count({ where: { is_active: true } });

    const formattedServiceCounts = {
      total: serviceCounts._count._all,
      active: await prisma.services.count({ where: { is_active: true } }),
      pending: await prisma.services.count({ where: { moderated_at: null, is_active: true } })
    };

    const formattedReportCounts = {
      total: await prisma.user_reports.count(),
      pending: reportCounts.find(r => r.status === 'pending')?._count._all || 0,
      reviewed: reportCounts.find(r => r.status === 'reviewed')?._count._all || 0,
      resolved: reportCounts.find(r => r.status === 'resolved')?._count._all || 0,
      dismissed: reportCounts.find(r => r.status === 'dismissed')?._count._all || 0
    };

    res.json({
      users: formattedUserCounts,
      services: formattedServiceCounts,
      reports: formattedReportCounts
    });
  } catch (error) {
    console.error('Error getting analytics dashboard:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAnalyticsUsers = async (req, res) => {
  try {
    const rows = await prisma.users.groupBy({
      by: ['role', 'is_active'],
      _count: { _all: true }
    });
    
    const mappedRows = rows.map(r => ({
      role: r.role,
      is_active: r.is_active,
      count: r._count._all
    }));

    res.json({ users: mappedRows });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAnalyticsServices = async (req, res) => {
  try {
    const rows = await prisma.services.groupBy({
      by: ['category', 'city'],
      _count: { _all: true }
    });

    const mappedRows = rows.map(r => ({
      category: r.category,
      city: r.city,
      count: r._count._all
    }));

    res.json({ services: mappedRows });
  } catch (error) {
    console.error('Error getting service analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAnalyticsExport = async (req, res) => {
  try {
    const [userCounts, serviceCounts, reportCountsResult] = await Promise.all([
      prisma.users.aggregate({
        _count: { _all: true }
      }),
      prisma.services.aggregate({
        _count: { _all: true }
      }),
      prisma.user_reports.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ]);

    const activeUsers = await prisma.users.count({ where: { is_active: true } });
    const roles = await prisma.users.groupBy({ by: ['role'], _count: { _all: true } });
    const activeServices = await prisma.services.count({ where: { is_active: true } });
    const pendingServices = await prisma.services.count({ where: { moderated_at: null } });

    res.json({
      generated_at: new Date().toISOString(),
      users: {
        total: userCounts._count._all,
        users: roles.find(r => r.role === 'user')?._count._all || 0,
        moderators: roles.find(r => r.role === 'moderator')?._count._all || 0,
        admins: roles.find(r => r.role === 'admin')?._count._all || 0,
        active_users: activeUsers
      },
      services: {
        total: serviceCounts._count._all,
        active: activeServices,
        pending: pendingServices
      },
      reports: {
        total: await prisma.user_reports.count(),
        pending: reportCountsResult.find(r => r.status === 'pending')?._count._all || 0,
        reviewed: reportCountsResult.find(r => r.status === 'reviewed')?._count._all || 0,
        resolved: reportCountsResult.find(r => r.status === 'resolved')?._count._all || 0,
        dismissed: reportCountsResult.find(r => r.status === 'dismissed')?._count._all || 0
      }
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * System settings and logs
 */
const getSystemConfig = async (req, res) => {
  try {
    const settings = await prisma.system_settings.findMany({
      orderBy: { setting_key: 'asc' }
    });
    res.json({ settings });
  } catch (error) {
    console.error('Error getting system config:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateSystemConfig = async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;

    await prisma.system_settings.upsert({
      where: { setting_key },
      update: {
        setting_value,
        updated_by: req.user.id,
        updated_at: new Date()
      },
      create: {
        id: uuidv4(),
        setting_key,
        setting_value,
        updated_by: req.user.id
      }
    });

    res.json({ message: 'System setting updated' });

    await logAdminAction('system_config_update', req.user.id, 'system_setting', setting_key, {
      setting_value
    }, req);
  } catch (error) {
    console.error('Error updating system config:', error);
    res.status(500).json({ error: error.message });
  }
};

const setMaintenanceMode = async (req, res) => {
  try {
    const { enabled, message } = req.body;

    await prisma.system_settings.upsert({
      where: { setting_key: 'maintenance_mode' },
      update: {
        setting_value: enabled ? 'true' : 'false',
        updated_by: req.user.id,
        updated_at: new Date()
      },
      create: {
        id: uuidv4(),
        setting_key: 'maintenance_mode',
        setting_value: enabled ? 'true' : 'false',
        updated_by: req.user.id
      }
    });

    if (message !== undefined) {
      await prisma.system_settings.upsert({
        where: { setting_key: 'maintenance_message' },
        update: {
          setting_value: message,
          updated_by: req.user.id,
          updated_at: new Date()
        },
        create: {
          id: uuidv4(),
          setting_key: 'maintenance_message',
          setting_value: message,
          updated_by: req.user.id
        }
      });
    }

    res.json({ message: 'Maintenance mode updated', enabled: !!enabled });

    await logAdminAction('system_maintenance_update', req.user.id, 'system_setting', 'maintenance_mode', {
      enabled: !!enabled,
      message: message || null
    }, req);
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    res.status(500).json({ error: error.message });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, actor_id } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (action) where.action = action;
    if (actor_id) where.actor_id = actor_id;

    const [logs, total] = await Promise.all([
      prisma.admin_action_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.admin_action_logs.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting system logs:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Audit Logs Retrieval
 */
const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      actionType, 
      actorId, 
      entityType, 
      startDate, 
      endDate 
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const filters = [];
    if (actionType) {
      filters.push({ action_type: { contains: String(actionType).trim() } });
    }
    if (actorId) {
      const actorSearch = String(actorId).trim();
      filters.push({
        OR: [
          { actor_id: { contains: actorSearch } },
          { users: { is: { name: { contains: actorSearch } } } },
          { users: { is: { email: { contains: actorSearch } } } }
        ]
      });
    }
    if (entityType) {
      filters.push({ entity_type: { contains: String(entityType).trim() } });
    }
    if (startDate || endDate) {
      const createdAtFilter = {};

      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          createdAtFilter.gte = start;
        }
      }

      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          createdAtFilter.lte = end;
        }
      }

      if (Object.keys(createdAtFilter).length > 0) {
        filters.push({ created_at: createdAtFilter });
      }
    }

    const where = filters.length > 0 ? { AND: filters } : {};

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        include: {
          users: {
            select: { name: true, email: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.audit_logs.count({ where })
    ]);

    res.json({
      logs: logs.map(log => ({
        ...log,
        actor_name: log.users?.name,
        actor_email: log.users?.email
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
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
  createModerator,
  listModerators,
  promoteToModerator,
  demoteModerator,
  getAnalyticsDashboard,
  getAnalyticsUsers,
  getAnalyticsServices,
  getAnalyticsExport,
  getSystemConfig,
  updateSystemConfig,
  getAuditLogs,
  setMaintenanceMode
};

