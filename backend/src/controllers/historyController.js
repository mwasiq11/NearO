import { pool } from '../db/database.js';

/**
 * Get audit history - role-based access control
 * Admin: can see all history
 * Moderator: can see service moderation history and user actions only (not admin actions)
 * User: can see their own history only
 */
const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, entity_type, action_type, user_id, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        al.id,
        al.actor_id,
        u.name as actor_name,
        u.email as actor_email,
        al.action_type,
        al.entity_type,
        al.entity_id,
        al.old_value,
        al.new_value,
        al.metadata,
        al.ip_address,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON al.actor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based access control
    if (userRole === 'user') {
      // Users can only see their own history
      query += ' AND al.actor_id = ?';
      params.push(userId);
    } else if (userRole === 'moderator') {
      // Moderators can see:
      // 1. Service moderation actions
      // 2. User actions (but not admin-specific actions)
      query += ` AND (
        (al.action_type IN ('service_approved', 'service_rejected', 'service_moderated'))
        OR (al.entity_type = 'user' AND al.action_type NOT IN ('admin_login', 'user_suspended', 'user_banned', 'role_changed'))
      )`;
    }
    // Admin has access to everything

    // Additional filters
    if (entity_type) {
      query += ' AND al.entity_type = ?';
      params.push(entity_type);
    }

    if (action_type) {
      query += ' AND al.action_type = ?';
      params.push(action_type);
    }

    if (user_id) {
      if (userRole === 'admin') {
        query += ' AND al.actor_id = ?';
        params.push(user_id);
      } else if (userRole !== 'user') {
        // Moderators can't filter by other users
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'Moderators cannot filter history by specific users'
        });
      }
    }

    if (start_date) {
      query += ' AND al.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND al.created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [history] = await pool.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total FROM audit_logs al
      WHERE 1=1
    `;
    const countParams = [...params.slice(0, -2)]; // Remove limit and offset

    if (userRole === 'user') {
      countQuery += ' AND al.actor_id = ?';
      countParams.push(userId);
    } else if (userRole === 'moderator') {
      countQuery += ` AND (
        (al.action_type IN ('service_approved', 'service_rejected', 'service_moderated'))
        OR (al.entity_type = 'user' AND al.action_type NOT IN ('admin_login', 'user_suspended', 'user_banned', 'role_changed'))
      )`;
    }

    if (entity_type) {
      countQuery += ' AND al.entity_type = ?';
    }

    if (action_type) {
      countQuery += ' AND al.action_type = ?';
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user service history (provider - services provided, seeker - services booked)
 */
const getUserServiceHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query; // type: 'provider' or 'seeker'
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    if (!type || !['provider', 'seeker'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "provider" or "seeker"' });
    }

    let query, params = [userId];

    if (type === 'provider') {
      // Services provided
      query = `
        SELECT 
          s.id,
          s.title,
          s.description,
          s.category,
          s.price,
          s.created_at,
          s.is_active,
          (SELECT COUNT(*) FROM bookings WHERE service_id = s.id) as booking_count,
          (SELECT AVG(rating) FROM reviews WHERE service_id = s.id) as avg_rating
        FROM services s
        WHERE s.provider_id = ?
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;
      params.push(parseInt(limit), offset);

      const [services] = await pool.execute(query, params);

      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM services WHERE provider_id = ?',
        [userId]
      );

      const total = countResult[0].total;

      res.json({
        services: services.map(s => ({
          ...s,
          avg_rating: parseFloat(s.avg_rating) || 0
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } else {
      // Services booked (as seeker)
      query = `
        SELECT 
          b.id as booking_id,
          b.requested_time,
          b.status,
          b.created_at,
          s.id as service_id,
          s.title,
          s.description,
          s.category,
          s.price,
          u.id as provider_id,
          u.name as provider_name,
          u.email as provider_email
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users u ON s.provider_id = u.id
        WHERE b.seeker_id = ?
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `;
      params.push(parseInt(limit), offset);

      const [bookings] = await pool.execute(query, params);

      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE seeker_id = ?',
        [userId]
      );

      const total = countResult[0].total;

      res.json({
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error getting service history:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get dashboard stats - role-based
 */
const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === 'admin') {
      // Admin dashboard stats
      const [totalUsersResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
      const [totalServicesResult] = await pool.execute('SELECT COUNT(*) as total FROM services WHERE is_active = TRUE');
      const [totalBookingsResult] = await pool.execute('SELECT COUNT(*) as total FROM bookings');
      const [pendingModerationsResult] = await pool.execute('SELECT COUNT(*) as total FROM services WHERE is_active = FALSE AND moderated_at IS NULL');
      const [totalReportsResult] = await pool.execute('SELECT COUNT(*) as total FROM user_reports WHERE status = "pending"');

      res.json({
        role: 'admin',
        stats: {
          totalUsers: totalUsersResult[0].total,
          totalServices: totalServicesResult[0].total,
          totalBookings: totalBookingsResult[0].total,
          pendingModerations: pendingModerationsResult[0].total,
          pendingReports: totalReportsResult[0].total
        }
      });
    } else if (userRole === 'moderator') {
      // Moderator dashboard stats
      const [totalServicesResult] = await pool.execute('SELECT COUNT(*) as total FROM services WHERE is_active = TRUE');
      const [pendingModerationsResult] = await pool.execute('SELECT COUNT(*) as total FROM services WHERE moderated_at IS NULL');
      const [totalReportsResult] = await pool.execute('SELECT COUNT(*) as total FROM user_reports WHERE status = "pending"');

      res.json({
        role: 'moderator',
        stats: {
          totalServices: totalServicesResult[0].total,
          pendingModerations: pendingModerationsResult[0].total,
          pendingReports: totalReportsResult[0].total
        }
      });
    } else {
      // User dashboard stats
      const [servicesProvidedResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM services WHERE provider_id = ?',
        [userId]
      );
      const [bookingsMadeResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE seeker_id = ?',
        [userId]
      );
      const [reviewsReceivedResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM reviews WHERE provider_id = ?',
        [userId]
      );
      const [avgRatingResult] = await pool.execute(
        'SELECT AVG(rating) as avg_rating FROM reviews WHERE provider_id = ?',
        [userId]
      );

      res.json({
        role: 'user',
        stats: {
          servicesProvided: servicesProvidedResult[0].total,
          bookingsMade: bookingsMadeResult[0].total,
          reviewsReceived: reviewsReceivedResult[0].total,
          avgRating: parseFloat(avgRatingResult[0].avg_rating) || 0
        }
      });
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  getHistory,
  getUserServiceHistory,
  getDashboardStats
};
