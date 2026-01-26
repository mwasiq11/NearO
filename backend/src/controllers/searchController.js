import { pool, readPool } from '../db/database.js';
import { filterByDistance, parseRadius, getBoundingBox, isValidLatLng } from '../utils/location.js';
import { getOrSetCache } from '../cache/cache.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Advanced search with multiple filters
 */
const searchServices = async (req, res) => {
  try {
    const {
      category,
      neighborhood,
      city,
      price_min,
      price_max,
      lat,
      lng,
      radius,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT s.*, u.name as provider_name, u.email as provider_email
      FROM services s
      JOIN users u ON s.provider_id = u.id
      WHERE s.is_active = TRUE
    `;
    const params = [];

    // Category filter
    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }

    // Neighborhood filter
    if (neighborhood) {
      query += ' AND s.neighborhood = ?';
      params.push(neighborhood);
    }

    // City filter
    if (city) {
      query += ' AND s.city = ?';
      params.push(city);
    }

    // Price range filter
    if (price_min) {
      query += ' AND s.price >= ?';
      params.push(parseFloat(price_min));
    }

    if (price_max) {
      query += ' AND s.price <= ?';
      params.push(parseFloat(price_max));
    }

    // Location-based filtering (bounding box for initial filter)
    let locationFiltered = false;
    if (lat && lng && isValidLatLng(parseFloat(lat), parseFloat(lng))) {
      const radiusKm = parseRadius(radius || '10');
      const bbox = getBoundingBox(parseFloat(lat), parseFloat(lng), radiusKm);
      
      query += ' AND s.latitude IS NOT NULL AND s.longitude IS NOT NULL';
      query += ' AND s.latitude BETWEEN ? AND ?';
      query += ' AND s.longitude BETWEEN ? AND ?';
      params.push(bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng);
      locationFiltered = true;
    }

    // Sorting
    const validSortFields = ['created_at', 'price', 'title'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY s.${sortField} ${sortOrder}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [services] = await readPool.execute(query, params);

    // Apply distance filtering if location was provided
    let filteredServices = services;
    if (locationFiltered && lat && lng) {
      const radiusKm = parseRadius(radius || '10');
      filteredServices = filterByDistance(
        services,
        parseFloat(lat),
        parseFloat(lng),
        radiusKm
      );
    }

    // Get total count (without location distance filter for performance)
    let countQuery = 'SELECT COUNT(*) as total FROM services s WHERE s.is_active = TRUE';
    const countParams = [];
    
    if (category) {
      countQuery += ' AND s.category = ?';
      countParams.push(category);
    }
    if (neighborhood) {
      countQuery += ' AND s.neighborhood = ?';
      countParams.push(neighborhood);
    }
    if (city) {
      countQuery += ' AND s.city = ?';
      countParams.push(city);
    }
    if (price_min) {
      countQuery += ' AND s.price >= ?';
      countParams.push(parseFloat(price_min));
    }
    if (price_max) {
      countQuery += ' AND s.price <= ?';
      countParams.push(parseFloat(price_max));
    }

    const [countResult] = await readPool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Track search history (if user is authenticated)
    if (req.user && req.user.id) {
      try {
        const searchHistoryId = uuidv4();
        const filters = {
          price_min: price_min ? parseFloat(price_min) : null,
          price_max: price_max ? parseFloat(price_max) : null,
          radius: radius || null,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null
        };
        
        await pool.execute(
          `INSERT INTO user_search_history (id, user_id, search_query, category, city, neighborhood, filters)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            searchHistoryId,
            req.user.id,
            null, // search_query can be null for filtered searches
            category || null,
            city || null,
            neighborhood || null,
            JSON.stringify(filters)
          ]
        );
      } catch (error) {
        // Don't fail the search if history tracking fails
        console.error('Error tracking search history:', error);
      }
    }

    res.json({
      services: filteredServices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        category: category || null,
        neighborhood: neighborhood || null,
        city: city || null,
        price_min: price_min ? parseFloat(price_min) : null,
        price_max: price_max ? parseFloat(price_max) : null,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng), radius: parseRadius(radius || '10') } : null
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Find services nearby a location
 */
const findNearbyServices = async (req, res) => {
  try {
    const { lat, lng, radius = '10', category, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!isValidLatLng(latitude, longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const radiusKm = parseRadius(radius);
    const bbox = getBoundingBox(latitude, longitude, radiusKm);

    let query = `
      SELECT s.*, u.name as provider_name, u.email as provider_email
      FROM services s
      JOIN users u ON s.provider_id = u.id
      WHERE s.is_active = TRUE
      AND s.latitude IS NOT NULL
      AND s.longitude IS NOT NULL
      AND s.latitude BETWEEN ? AND ?
      AND s.longitude BETWEEN ? AND ?
    `;
    const params = [bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng];

    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }

    query += ' LIMIT ?';
    params.push(parseInt(limit));

    const [services] = await readPool.execute(query, params);

    // Filter by exact distance and sort
    const nearbyServices = filterByDistance(services, latitude, longitude, radiusKm);

    res.json({
      services: nearbyServices,
      location: {
        lat: latitude,
        lng: longitude,
        radius: radiusKm
      },
      count: nearbyServices.length
    });
  } catch (error) {
    console.error('Nearby search error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get available categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await getOrSetCache(
      'cache:categories:active',
      3600,
      async () => {
        const [rows] = await readPool.execute(
          'SELECT * FROM service_categories WHERE is_active = TRUE ORDER BY name ASC'
        );
        return rows;
      }
    );

    res.json({ categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get neighborhoods in a city
 */
const getNeighborhoods = async (req, res) => {
  try {
    const { city } = req.query;

    const cacheKey = city ? `cache:neighborhoods:${city}` : 'cache:neighborhoods:all';
    const neighborhoods = await getOrSetCache(cacheKey, 1800, async () => {
      let query = 'SELECT DISTINCT neighborhood, city, COUNT(*) as service_count FROM services WHERE neighborhood IS NOT NULL';
      const params = [];

      if (city) {
        query += ' AND city = ?';
        params.push(city);
      }

      query += ' GROUP BY neighborhood, city ORDER BY city, neighborhood';
      const [rows] = await readPool.execute(query, params);
      return rows;
    });

    res.json({ neighborhoods });
  } catch (error) {
    console.error('Error getting neighborhoods:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get cities
 */
const getCities = async (req, res) => {
  try {
    const cities = await getOrSetCache(
      'cache:cities:all',
      1800,
      async () => {
        const [rows] = await readPool.execute(
          'SELECT DISTINCT city, COUNT(*) as service_count FROM services WHERE city IS NOT NULL GROUP BY city ORDER BY city'
        );
        return rows;
      }
    );

    res.json({ cities });
  } catch (error) {
    console.error('Error getting cities:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  searchServices,
  findNearbyServices,
  getCategories,
  getNeighborhoods,
  getCities
};

