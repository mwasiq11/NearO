import prisma from '../db/prisma.js';

/**
 * Get audit history - role-based access control
 * Admin: can see all history
 * Moderator: can see service moderation history and user actions only (not admin actions)
 * User: can see their own history only
 */
const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, entity_type, action_type, user_id, start_date, end_date } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const userId = req.user.id;
    const userRole = req.user.role;

    const where = {};

    // Role-based access control filters
    if (userRole === 'user') {
      where.actor_id = userId;
    } else if (userRole === 'moderator') {
      where.OR = [
        { action_type: { in: ['service_approved', 'service_rejected', 'service_moderated'] } },
        { 
          entity_type: 'user', 
          action_type: { notIn: ['admin_login', 'user_suspended', 'user_banned', 'role_changed'] } 
        }
      ];
    }

    // Additional filters
    if (entity_type) where.entity_type = entity_type;
    if (action_type) where.action_type = action_type;
    
    if (user_id) {
      if (userRole === 'admin') {
        where.actor_id = user_id;
      } else if (userRole !== 'user') {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'Moderators cannot filter history by specific users'
        });
      }
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date);
      if (end_date) where.created_at.lte = new Date(end_date);
    }

    const [history, total] = await Promise.all([
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

    const mappedHistory = history.map(h => ({
      ...h,
      actor_name: h.users?.name,
      actor_email: h.users?.email
    }));

    res.json({
      history: mappedHistory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
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
    const { page = 1, limit = 20, type = 'seeker' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const userId = req.user.id;

    if (!type || !['provider', 'seeker'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "provider" or "seeker"' });
    }

    if (type === 'provider') {
      const [services, total] = await Promise.all([
        prisma.services.findMany({
          where: { provider_id: userId },
          include: {
            _count: {
              select: { bookings: true }
            },
            reviews: {
              select: { rating: true }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: offset,
          take: limitNum
        }),
        prisma.services.count({ where: { provider_id: userId } })
      ]);

      const mappedServices = services.map(s => {
        const avgRating = s.reviews.length > 0 
          ? s.reviews.reduce((acc, curr) => acc + curr.rating, 0) / s.reviews.length 
          : 0;
        return {
          ...s,
          booking_count: s._count.bookings,
          avg_rating: avgRating
        };
      });

      res.json({
        services: mappedServices,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } else {
      const [bookings, total] = await Promise.all([
        prisma.bookings.findMany({
          where: { seeker_id: userId },
          include: {
            services: {
              include: {
                users_services_provider_idTousers: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: offset,
          take: limitNum
        }),
        prisma.bookings.count({ where: { seeker_id: userId } })
      ]);

      const mappedBookings = bookings.map(b => ({
        booking_id: b.id,
        requested_time: b.requested_time,
        status: b.status,
        created_at: b.created_at,
        service_id: b.services.id,
        title: b.services.title,
        description: b.services.description,
        category: b.services.category,
        price: b.services.price,
        provider_id: b.services.users_services_provider_idTousers.id,
        provider_name: b.services.users_services_provider_idTousers.name,
        provider_email: b.services.users_services_provider_idTousers.email
      }));

      res.json({
        bookings: mappedBookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
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
      const [totalUsers, totalServices, totalBookings, pendingModerations, pendingReports] = await Promise.all([
        prisma.users.count(),
        prisma.services.count({ where: { is_active: true } }),
        prisma.bookings.count(),
        prisma.services.count({ where: { is_active: false, moderated_at: null } }),
        prisma.user_reports.count({ where: { status: 'pending' } })
      ]);

      res.json({
        role: 'admin',
        stats: { totalUsers, totalServices, totalBookings, pendingModerations, pendingReports }
      });
    } else if (userRole === 'moderator') {
      const [totalServices, pendingModerations, pendingReports] = await Promise.all([
        prisma.services.count({ where: { is_active: true } }),
        prisma.services.count({ where: { moderated_at: null } }),
        prisma.user_reports.count({ where: { status: 'pending' } })
      ]);

      res.json({
        role: 'moderator',
        stats: { totalServices, pendingModerations, pendingReports }
      });
    } else {
      const [servicesProvided, bookingsMade, reviewsReceived, avgRatingResult] = await Promise.all([
        prisma.services.count({ where: { provider_id: userId } }),
        prisma.bookings.count({ where: { seeker_id: userId } }),
        prisma.reviews.count({ where: { provider_id: userId } }),
        prisma.reviews.aggregate({
          where: { provider_id: userId },
          _avg: { rating: true }
        })
      ]);

      res.json({
        role: 'user',
        stats: {
          servicesProvided,
          bookingsMade,
          reviewsReceived,
          avgRating: avgRatingResult._avg.rating || 0
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
