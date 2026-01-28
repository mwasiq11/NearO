import { pool, readPool } from '../db/database.js';

/**
 * Get provider earnings statistics
 */
const getProviderEarnings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    // Get total earnings from approved bookings
    const [earningsData] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'approved' THEN b.id END) as completed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
        COUNT(DISTINCT b.seeker_id) as total_clients,
        COALESCE(SUM(CASE WHEN b.status = 'approved' THEN s.price ELSE 0 END), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN b.status = 'pending' THEN s.price ELSE 0 END), 0) as pending_earnings
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE s.provider_id = ?`,
      [userId]
    );

    // Get earnings by service
    const [earningsByService] = await pool.execute(
      `SELECT 
        s.id,
        s.title,
        s.category,
        s.price,
        COUNT(b.id) as booking_count,
        COUNT(CASE WHEN b.status = 'approved' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN b.status = 'approved' THEN s.price ELSE 0 END), 0) as total_earned
       FROM services s
       LEFT JOIN bookings b ON s.id = b.service_id
       WHERE s.provider_id = ?
       GROUP BY s.id, s.title, s.category, s.price
       ORDER BY total_earned DESC`,
      [userId]
    );

    // Get monthly earnings trend (last 6 months)
    const [monthlyTrend] = await pool.execute(
      `SELECT 
        DATE_FORMAT(b.created_at, '%Y-%m') as month,
        DATE_FORMAT(b.created_at, '%b %Y') as month_label,
        COUNT(b.id) as bookings,
        COALESCE(SUM(s.price), 0) as earnings
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE s.provider_id = ? 
         AND b.status = 'approved'
         AND b.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(b.created_at, '%Y-%m'), DATE_FORMAT(b.created_at, '%b %Y')
       ORDER BY month ASC`,
      [userId]
    );

    // Get recent completed bookings
    const [recentBookings] = await pool.execute(
      `SELECT 
        b.id,
        b.service_id,
        b.seeker_id,
        b.requested_time,
        b.status,
        b.created_at,
        s.title as service_title,
        s.price,
        u.name as seeker_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON b.seeker_id = u.id
       WHERE s.provider_id = ? AND b.status = 'approved'
       ORDER BY b.created_at DESC
       LIMIT 10`,
      [userId]
    );

    const stats = earningsData[0] || {
      total_bookings: 0,
      completed_bookings: 0,
      pending_bookings: 0,
      total_clients: 0,
      total_earnings: 0,
      pending_earnings: 0
    };

    res.json({
      stats: {
        totalEarnings: parseFloat(stats.total_earnings),
        pendingEarnings: parseFloat(stats.pending_earnings),
        totalBookings: stats.total_bookings,
        completedBookings: stats.completed_bookings,
        pendingBookings: stats.pending_bookings,
        totalClients: stats.total_clients,
      },
      earningsByService: earningsByService.map(service => ({
        id: service.id,
        title: service.title,
        category: service.category,
        price: parseFloat(service.price),
        bookingCount: service.booking_count,
        completedCount: service.completed_count,
        totalEarned: parseFloat(service.total_earned),
      })),
      monthlyTrend: monthlyTrend.map(month => ({
        month: month.month,
        monthLabel: month.month_label,
        bookings: month.bookings,
        earnings: parseFloat(month.earnings),
      })),
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        serviceId: booking.service_id,
        serviceTitle: booking.service_title,
        price: parseFloat(booking.price),
        seekerId: booking.seeker_id,
        seekerName: booking.seeker_name,
        requestedTime: booking.requested_time,
        status: booking.status,
        createdAt: booking.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching provider earnings:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get seeker spending statistics
 */
const getSeekerSpending = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    // Get total spending from approved bookings
    const [spendingData] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'approved' THEN b.id END) as completed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
        COUNT(DISTINCT s.provider_id) as total_providers,
        COALESCE(SUM(CASE WHEN b.status = 'approved' THEN s.price ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN b.status = 'pending' THEN s.price ELSE 0 END), 0) as pending_amount
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.seeker_id = ?`,
      [userId]
    );

    // Get spending by category
    const [spendingByCategory] = await pool.execute(
      `SELECT 
        s.category,
        COUNT(b.id) as booking_count,
        COUNT(CASE WHEN b.status = 'approved' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN b.status = 'approved' THEN s.price ELSE 0 END), 0) as total_spent
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.seeker_id = ?
       GROUP BY s.category
       ORDER BY total_spent DESC`,
      [userId]
    );

    // Get monthly spending trend (last 6 months)
    const [monthlyTrend] = await pool.execute(
      `SELECT 
        DATE_FORMAT(b.created_at, '%Y-%m') as month,
        DATE_FORMAT(b.created_at, '%b %Y') as month_label,
        COUNT(b.id) as bookings,
        COALESCE(SUM(s.price), 0) as spending
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.seeker_id = ? 
         AND b.status = 'approved'
         AND b.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(b.created_at, '%Y-%m'), DATE_FORMAT(b.created_at, '%b %Y')
       ORDER BY month ASC`,
      [userId]
    );

    // Get recent completed bookings
    const [recentBookings] = await pool.execute(
      `SELECT 
        b.id,
        b.service_id,
        b.requested_time,
        b.status,
        b.created_at,
        s.title as service_title,
        s.price,
        s.category,
        u.name as provider_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON s.provider_id = u.id
       WHERE b.seeker_id = ? AND b.status = 'approved'
       ORDER BY b.created_at DESC
       LIMIT 10`,
      [userId]
    );

    const stats = spendingData[0] || {
      total_bookings: 0,
      completed_bookings: 0,
      pending_bookings: 0,
      total_providers: 0,
      total_spent: 0,
      pending_amount: 0
    };

    res.json({
      stats: {
        totalSpent: parseFloat(stats.total_spent),
        pendingAmount: parseFloat(stats.pending_amount),
        totalBookings: stats.total_bookings,
        completedBookings: stats.completed_bookings,
        pendingBookings: stats.pending_bookings,
        totalProviders: stats.total_providers,
      },
      spendingByCategory: spendingByCategory.map(cat => ({
        category: cat.category,
        bookingCount: cat.booking_count,
        completedCount: cat.completed_count,
        totalSpent: parseFloat(cat.total_spent),
      })),
      monthlyTrend: monthlyTrend.map(month => ({
        month: month.month,
        monthLabel: month.month_label,
        bookings: month.bookings,
        spending: parseFloat(month.spending),
      })),
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        serviceId: booking.service_id,
        serviceTitle: booking.service_title,
        category: booking.category,
        price: parseFloat(booking.price),
        providerName: booking.provider_name,
        requestedTime: booking.requested_time,
        status: booking.status,
        createdAt: booking.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching seeker spending:', error);
    res.status(500).json({ error: error.message });
  }
};

export { getProviderEarnings, getSeekerSpending };
