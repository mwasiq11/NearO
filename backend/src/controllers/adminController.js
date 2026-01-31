import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { pool } from '../db/database.js';
import { normalizeLocation } from '../utils/location.js';
import { invalidateCache } from '../cache/cache.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';

async function logAdminAction(action, actorId, targetType = null, targetId = null, metadata = null, req = null) {
  try {
    await pool.execute(
      `INSERT INTO admin_action_logs (id, action, actor_id, target_type, target_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), action, actorId, targetType, targetId, metadata ? JSON.stringify(metadata) : null]
    );
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

    let query = 'SELECT id, name, email, role, is_active, is_verified, created_at, last_login_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [users] = await pool.execute(query, params);

    // Get total count with same filters
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    if (role) {
      countQuery += ' AND role = ?';
    }
    if (is_active !== undefined) {
      countQuery += ' AND is_active = ?';
    }
    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ?)';
    }
    const countParams = params.slice(0, -2); // Remove limit and offset
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

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

    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active, is_verified, created_at, last_login_at, suspended_until, suspension_reason FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [warnings] = await pool.execute(
      'SELECT id, reason, warned_by, created_at FROM user_warnings WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({
      user: users[0],
      warnings
    });
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
    const [users] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Prevent suspending admins (unless current user is also admin)
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot suspend admin users' });
    }

    // Calculate suspension end time
    const suspendedUntil = new Date();
    suspendedUntil.setHours(suspendedUntil.getHours() + parseInt(duration_hours));

    await pool.execute(
      'UPDATE users SET is_active = FALSE, suspended_until = ?, suspension_reason = ? WHERE id = ?',
      [suspendedUntil, reason || 'Suspended by moderator', id]
    );

    res.json({ 
      message: 'User suspended successfully',
      suspended_until: suspendedUntil
    });

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

    await pool.execute(
      'UPDATE users SET is_active = TRUE, suspended_until = NULL, suspension_reason = NULL WHERE id = ?',
      [id]
    );

    res.json({ message: 'User unsuspended successfully' });

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

    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const warningId = uuidv4();
    await pool.execute(
      'INSERT INTO user_warnings (id, user_id, warned_by, reason) VALUES (?, ?, ?, ?)',
      [warningId, id, req.user.id, reason]
    );

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

    const [users] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot ban admin users' });
    }

    await pool.execute(
      'UPDATE users SET is_active = FALSE, suspended_until = NULL, suspension_reason = ? WHERE id = ?',
      [reason ? `Banned: ${reason}` : 'Banned by admin', id]
    );

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

    const [users] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);

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

    const [services] = await pool.execute(
      `SELECT s.*, u.name as provider_name, u.email as provider_email 
       FROM services s 
       JOIN users u ON s.provider_id = u.id 
       WHERE s.moderated_at IS NULL 
       ORDER BY s.created_at ASC 
       LIMIT ? OFFSET ?`,
      [limitNum, offset]
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM services WHERE moderated_at IS NULL'
    );
    const total = countResult[0].total;

    res.json({
      services,
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

    const [services] = await pool.execute(
      `SELECT s.*, u.name as provider_name, u.email as provider_email
       FROM services s
       JOIN users u ON s.provider_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(services[0]);
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

    const [services] = await pool.execute('SELECT id FROM services WHERE id = ?', [id]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (availability !== undefined) { updates.push('availability = ?'); params.push(availability); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

    if (latitude !== undefined || longitude !== undefined) {
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Both latitude and longitude are required for location updates' });
      }
      const locationData = normalizeLocation({ latitude, longitude, neighborhood, city });
      if (!locationData) {
        return res.status(400).json({ error: 'Invalid location data' });
      }
      updates.push('latitude = ?', 'longitude = ?', 's2_cell_id = ?', 'neighborhood = ?', 'city = ?');
      params.push(
        locationData.latitude,
        locationData.longitude,
        locationData.s2_cell_id ? locationData.s2_cell_id.toString() : null,
        locationData.neighborhood,
        locationData.city
      );
    } else {
      if (neighborhood !== undefined) { updates.push('neighborhood = ?'); params.push(neighborhood); }
      if (city !== undefined) { updates.push('city = ?'); params.push(city); }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);
    await pool.execute(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.execute('SELECT * FROM services WHERE id = ?', [id]);
    res.json(updated[0]);

    await logAdminAction('service_update_any', req.user.id, 'service', id, {
      fields: updates.map(entry => entry.split('=')[0].trim())
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

    const [services] = await pool.execute('SELECT id FROM services WHERE id = ?', [id]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await pool.execute('DELETE FROM services WHERE id = ?', [id]);

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

    await pool.execute(
      'UPDATE services SET moderated_at = NOW(), moderated_by = ?, is_active = TRUE WHERE id = ?',
      [req.user.id, id]
    );

    res.json({ message: 'Service approved successfully' });

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

    await pool.execute(
      'UPDATE services SET moderated_at = NOW(), moderated_by = ?, is_active = FALSE WHERE id = ?',
      [req.user.id, id]
    );

    res.json({ message: 'Service rejected successfully' });

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

    let query = `
      SELECT r.*, 
             u1.name as reported_user_name, 
             u2.name as reporter_name,
             u3.name as reviewer_name
      FROM user_reports r
      LEFT JOIN users u1 ON r.reported_user_id = u1.id
      LEFT JOIN users u2 ON r.reported_by = u2.id
      LEFT JOIN users u3 ON r.reviewed_by = u3.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [reports] = await pool.execute(query, params);

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM user_reports' + (status ? ' WHERE status = ?' : ''),
      status ? [status] : []
    );
    const total = countResult[0].total;

    res.json({
      reports,
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

    await pool.execute(
      'UPDATE user_reports SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [status, req.user.id, id]
    );

    res.json({ message: 'Report status updated successfully' });

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
    let query = 'SELECT * FROM service_categories';
    const params = [];

    if (!include_inactive) {
      query += ' WHERE is_active = TRUE';
    }

    query += ' ORDER BY name ASC';

    const [categories] = await pool.execute(query, params);
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

    await pool.execute(
      'INSERT INTO service_categories (id, name, description) VALUES (?, ?, ?)',
      [id, name, description || null]
    );

    const [categories] = await pool.execute('SELECT * FROM service_categories WHERE id = ?', [id]);
    res.status(201).json(categories[0]);

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

    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);
    await pool.execute(`UPDATE service_categories SET ${updates.join(', ')} WHERE id = ?`, params);

    const [categories] = await pool.execute('SELECT * FROM service_categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(categories[0]);

    await logAdminAction('category_update', req.user.id, 'category', id, {
      fields: updates.map(entry => entry.split('=')[0].trim())
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

    await pool.execute('UPDATE service_categories SET is_active = FALSE WHERE id = ?', [id]);
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
    const [existing] = await pool.execute(
      'SELECT id, role, password FROM users WHERE email = ?', 
      [email]
    );

    if (existing.length > 0) {
      // User exists - promote them to moderator
      const existingUser = existing[0];
      
      if (existingUser.role === 'admin') {
        return res.status(400).json({ error: 'Cannot modify admin users' });
      }

      if (existingUser.role === 'moderator') {
        return res.status(400).json({ error: 'User is already a moderator' });
      }

      // Promote existing user to moderator
      await pool.execute(
        'UPDATE users SET role = ?, is_verified = ? WHERE id = ?',
        ['moderator', true, existingUser.id]
      );

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
      await pool.execute(
        'INSERT INTO users (id, name, email, password, role, is_active, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, email, hashedPassword, 'moderator', true, true]
      );

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
    const [moderators] = await pool.execute(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE role IN (\'moderator\', \'admin\') ORDER BY created_at DESC'
    );
    res.json({ moderators });
  } catch (error) {
    console.error('Error listing moderators:', error);
    res.status(500).json({ error: error.message });
  }
};

const promoteToModerator = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', ['moderator', id]);
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
    const [users] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (users[0].role === 'admin') {
      return res.status(403).json({ error: 'Cannot demote admin user' });
    }
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', ['user', id]);
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
    const [[userCounts]] = await pool.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(role = 'user') as users,
         SUM(role = 'moderator') as moderators,
         SUM(role = 'admin') as admins,
         SUM(is_active = TRUE) as active_users
       FROM users`
    );

    const [[serviceCounts]] = await pool.execute(
      `SELECT 
         COALESCE(COUNT(*), 0) as total,
         COALESCE(SUM(is_active = TRUE), 0) as active,
         COALESCE(SUM(moderated_at IS NULL AND is_active = TRUE), 0) as pending
       FROM services`
    );

    const [[reportCounts]] = await pool.execute(
      `SELECT 
         COALESCE(COUNT(*), 0) as total,
         COALESCE(SUM(status = 'pending'), 0) as pending,
         COALESCE(SUM(status = 'reviewed'), 0) as reviewed,
         COALESCE(SUM(status = 'resolved'), 0) as resolved,
         COALESCE(SUM(status = 'dismissed'), 0) as dismissed
       FROM user_reports`
    );

    res.json({
      users: userCounts,
      services: serviceCounts,
      reports: reportCounts
    });
  } catch (error) {
    console.error('Error getting analytics dashboard:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAnalyticsUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT role, is_active, COUNT(*) as count
       FROM users
       GROUP BY role, is_active`
    );
    res.json({ users: rows });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAnalyticsServices = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT category, city, COUNT(*) as count
       FROM services
       GROUP BY category, city`
    );
    res.json({ services: rows });
  } catch (error) {
    console.error('Error getting service analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAnalyticsExport = async (req, res) => {
  try {
    const [[userCounts]] = await pool.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(role = 'user') as users,
         SUM(role = 'moderator') as moderators,
         SUM(role = 'admin') as admins,
         SUM(is_active = TRUE) as active_users
       FROM users`
    );
    const [[serviceCounts]] = await pool.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(is_active = TRUE) as active,
         SUM(moderated_at IS NULL) as pending
       FROM services`
    );
    const [[reportCounts]] = await pool.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(status = 'pending') as pending,
         SUM(status = 'reviewed') as reviewed,
         SUM(status = 'resolved') as resolved,
         SUM(status = 'dismissed') as dismissed
       FROM user_reports`
    );

    res.json({
      generated_at: new Date().toISOString(),
      users: userCounts,
      services: serviceCounts,
      reports: reportCounts
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
    const [settings] = await pool.execute(
      'SELECT setting_key, setting_value, updated_at, updated_by FROM system_settings ORDER BY setting_key'
    );
    res.json({ settings });
  } catch (error) {
    console.error('Error getting system config:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateSystemConfig = async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;

    await pool.execute(
      `INSERT INTO system_settings (id, setting_key, setting_value, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
      [uuidv4(), setting_key, setting_value, req.user.id]
    );

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

    await pool.execute(
      `INSERT INTO system_settings (id, setting_key, setting_value, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
      [uuidv4(), 'maintenance_mode', enabled ? 'true' : 'false', req.user.id]
    );

    if (message !== undefined) {
      await pool.execute(
        `INSERT INTO system_settings (id, setting_key, setting_value, updated_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
        [uuidv4(), 'maintenance_message', message, req.user.id]
      );
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
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM admin_action_logs WHERE 1=1';
    const params = [];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    if (actor_id) {
      query += ' AND actor_id = ?';
      params.push(actor_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [logs] = await pool.execute(query, params);
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM admin_action_logs'
    );

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting system logs:', error);
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
  getSystemLogs,
  setMaintenanceMode
};

