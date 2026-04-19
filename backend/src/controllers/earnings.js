import prisma from '../db/prisma.js';

/**
 * Get provider earnings statistics
 */
const getProviderEarnings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    // Get stats from bookings
    const bookings = await prisma.bookings.findMany({
      where: {
        services: { provider_id: userId }
      },
      include: {
        services: { select: { price: true, category: true, title: true, id: true } }
      }
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'approved').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const totalClients = new Set(bookings.map(b => b.seeker_id)).size;
    
    const totalEarnings = bookings
      .filter(b => b.status === 'approved')
      .reduce((acc, b) => acc + (b.services.price || 0), 0);
    
    const pendingEarnings = bookings
      .filter(b => b.status === 'pending')
      .reduce((acc, b) => acc + (b.services.price || 0), 0);

    // Earnings by service
    const serviceMap = new Map();
    bookings.forEach(b => {
      const s = b.services;
      if (!serviceMap.has(s.id)) {
        serviceMap.set(s.id, {
          id: s.id,
          title: s.title,
          category: s.category,
          price: s.price,
          bookingCount: 0,
          completedCount: 0,
          totalEarned: 0
        });
      }
      const entry = serviceMap.get(s.id);
      entry.bookingCount++;
      if (b.status === 'approved') {
        entry.completedCount++;
        entry.totalEarned += s.price || 0;
      }
    });

    const earningsByService = Array.from(serviceMap.values())
      .sort((a, b) => b.totalEarned - a.totalEarned);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const trendBookings = bookings.filter(b => b.status === 'approved' && b.created_at >= sixMonthsAgo);
    const monthTrendMap = new Map();
    
    trendBookings.forEach(b => {
      const date = new Date(b.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!monthTrendMap.has(monthKey)) {
        monthTrendMap.set(monthKey, { month: monthKey, monthLabel: label, bookings: 0, earnings: 0 });
      }
      const entry = monthTrendMap.get(monthKey);
      entry.bookings++;
      entry.earnings += b.services.price || 0;
    });

    const monthlyTrend = Array.from(monthTrendMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // Recent completed bookings
    const recent = await prisma.bookings.findMany({
      where: {
        services: { provider_id: userId },
        status: 'approved'
      },
      include: {
        services: { select: { title: true, price: true } },
        users: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    const recentBookings = recent.map(b => ({
      id: b.id,
      serviceId: b.service_id,
      serviceTitle: b.services.title,
      price: b.services.price,
      seekerId: b.seeker_id,
      seekerName: b.users?.name,
      requestedTime: b.requested_time,
      status: b.status,
      createdAt: b.created_at
    }));

    res.json({
      stats: {
        totalEarnings,
        pendingEarnings,
        totalBookings,
        completedBookings,
        pendingBookings,
        totalClients
      },
      earningsByService,
      monthlyTrend,
      recentBookings
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

    const bookings = await prisma.bookings.findMany({
      where: { seeker_id: userId },
      include: {
        services: { select: { price: true, category: true, title: true, provider_id: true } }
      }
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'approved').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const totalProviders = new Set(bookings.map(b => b.services.provider_id)).size;
    
    const totalSpent = bookings
      .filter(b => b.status === 'approved')
      .reduce((acc, b) => acc + (b.services.price || 0), 0);
    
    const pendingAmount = bookings
      .filter(b => b.status === 'pending')
      .reduce((acc, b) => acc + (b.services.price || 0), 0);

    // Spending by category
    const categoryMap = new Map();
    bookings.forEach(b => {
      const cat = b.services.category;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          category: cat,
          bookingCount: 0,
          completedCount: 0,
          totalSpent: 0
        });
      }
      const entry = categoryMap.get(cat);
      entry.bookingCount++;
      if (b.status === 'approved') {
        entry.completedCount++;
        entry.totalSpent += b.services.price || 0;
      }
    });

    const spendingByCategory = Array.from(categoryMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Monthly spending trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const trendBookings = bookings.filter(b => b.status === 'approved' && b.created_at >= sixMonthsAgo);
    const monthTrendMap = new Map();
    
    trendBookings.forEach(b => {
      const date = new Date(b.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!monthTrendMap.has(monthKey)) {
        monthTrendMap.set(monthKey, { month: monthKey, monthLabel: label, bookings: 0, spending: 0 });
      }
      const entry = monthTrendMap.get(monthKey);
      entry.bookings++;
      entry.spending += b.services.price || 0;
    });

    const monthlyTrend = Array.from(monthTrendMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // Recent spending
    const recent = await prisma.bookings.findMany({
      where: {
        seeker_id: userId,
        status: 'approved'
      },
      include: {
        services: { 
          select: { 
            title: true, 
            price: true, 
            category: true,
            users_services_provider_idTousers: { select: { name: true } }
          } 
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    const recentBookings = recent.map(b => ({
      id: b.id,
      serviceId: b.service_id,
      serviceTitle: b.services.title,
      category: b.services.category,
      price: b.services.price,
      providerName: b.services.users_services_provider_idTousers.name,
      requestedTime: b.requested_time,
      status: b.status,
      createdAt: b.created_at
    }));

    res.json({
      stats: {
        totalSpent,
        pendingAmount,
        totalBookings,
        completedBookings,
        pendingBookings,
        totalProviders
      },
      spendingByCategory,
      monthlyTrend,
      recentBookings
    });
  } catch (error) {
    console.error('Error fetching seeker spending:', error);
    res.status(500).json({ error: error.message });
  }
};

export { getProviderEarnings, getSeekerSpending };
