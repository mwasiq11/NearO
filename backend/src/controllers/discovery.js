import { readPool } from '../db/database.js';

const getTrendingServices = async (req, res) => {
  try {
    const { city, neighborhood, limit = 20 } = req.query;
    const params = [];

    let query = `
      SELECT s.*,
             COUNT(b.id) as recent_bookings,
             AVG(r.rating) as avg_rating
      FROM services s
      LEFT JOIN bookings b ON b.service_id = s.id
        AND b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE s.is_active = TRUE
    `;

    if (city) {
      query += ' AND s.city = ?';
      params.push(city);
    }
    if (neighborhood) {
      query += ' AND s.neighborhood = ?';
      params.push(neighborhood);
    }

    query += `
      GROUP BY s.id
      ORDER BY (COUNT(b.id) * 2 + IFNULL(AVG(r.rating), 0) * 1.5) DESC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const [rows] = await readPool.execute(query, params);
    res.json({ services: rows });
  } catch (error) {
    console.error('Error getting trending services:', error);
    res.status(500).json({ error: error.message });
  }
};

const getRecommendedServices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    // Get categories from past bookings
    const [bookingCategories] = await readPool.execute(
      `SELECT s.category, COUNT(*) as cnt
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.seeker_id = ?
       GROUP BY s.category
       ORDER BY cnt DESC
       LIMIT 3`,
      [userId]
    );

    // Get categories from search history (last 30 days, weighted by recency)
    const [searchCategories] = await readPool.execute(
      `SELECT category, COUNT(*) as cnt,
              MAX(created_at) as last_searched
       FROM user_search_history
       WHERE user_id = ? 
         AND category IS NOT NULL
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY category
       ORDER BY cnt DESC, last_searched DESC
       LIMIT 5`,
      [userId]
    );

    // Get preferred cities/neighborhoods from search history
    const [locationPrefs] = await readPool.execute(
      `SELECT city, neighborhood, COUNT(*) as cnt
       FROM user_search_history
       WHERE user_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY city, neighborhood
       ORDER BY cnt DESC
       LIMIT 3`,
      [userId]
    );

    // Combine categories from bookings and searches
    const categoryMap = new Map();
    
    // Add booking categories (weight: 2x)
    bookingCategories.forEach(cat => {
      categoryMap.set(cat.category, (categoryMap.get(cat.category) || 0) + cat.cnt * 2);
    });
    
    // Add search categories (weight: 1x, but more recent = higher)
    searchCategories.forEach(cat => {
      const weight = cat.cnt;
      categoryMap.set(cat.category, (categoryMap.get(cat.category) || 0) + weight);
    });

    // Sort by weight and get top categories
    const sortedCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    // If no categories found, fall back to trending
    if (sortedCategories.length === 0) {
      return getTrendingServices(req, res);
    }

    const placeholders = sortedCategories.map(() => '?').join(',');
    let query = `
      SELECT s.*, AVG(r.rating) as avg_rating
      FROM services s
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE s.is_active = TRUE AND s.category IN (${placeholders})
    `;
    const params = [...sortedCategories];

    // Add location preference if available
    if (locationPrefs.length > 0) {
      const preferredCity = locationPrefs[0].city;
      const preferredNeighborhood = locationPrefs[0].neighborhood;
      
      if (preferredCity) {
        query += ' AND s.city = ?';
        params.push(preferredCity);
      }
      if (preferredNeighborhood) {
        query += ' AND s.neighborhood = ?';
        params.push(preferredNeighborhood);
      }
    }

    query += `
      GROUP BY s.id
      ORDER BY IFNULL(AVG(r.rating), 0) DESC, s.created_at DESC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const [services] = await readPool.execute(query, params);

    // Determine basis for recommendations
    let basis = 'mixed';
    if (bookingCategories.length > 0 && searchCategories.length === 0) {
      basis = 'past_bookings';
    } else if (searchCategories.length > 0 && bookingCategories.length === 0) {
      basis = 'search_history';
    } else if (searchCategories.length > 0 && bookingCategories.length > 0) {
      basis = 'bookings_and_searches';
    }

    res.json({ 
      services, 
      basis,
      insights: {
        categories_from_bookings: bookingCategories.length,
        categories_from_searches: searchCategories.length,
        preferred_locations: locationPrefs.length
      }
    });
  } catch (error) {
    console.error('Error getting recommended services:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  getTrendingServices,
  getRecommendedServices
};

