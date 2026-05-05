import prisma from '../db/prisma.js';
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

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    const where = { is_active: true };

    if (category) where.category = category;
    if (neighborhood) where.neighborhood = neighborhood;
    if (city) where.city = city;
    
    if (price_min || price_max) {
      where.price = {};
      if (price_min) where.price.gte = parseFloat(price_min);
      if (price_max) where.price.lte = parseFloat(price_max);
    }

    let requestLat = lat ? parseFloat(lat) : null;
    let requestLng = lng ? parseFloat(lng) : null;

    // Fallback to user profile location if not provided in query
    if ((!requestLat || !requestLng) && req.user?.latitude && req.user?.longitude) {
      requestLat = parseFloat(req.user.latitude);
      requestLng = parseFloat(req.user.longitude);
    }

    const hasValidCoords = isValidLatLng(requestLat, requestLng);
    const hasProfileNeighborhood = !!req.user?.neighborhood;
    const hasProfileCity = !!req.user?.city;

    // ─── PRIORITY: GPS > Profile Neighborhood > Profile City ───
    if (!hasValidCoords && !city && !neighborhood && !hasProfileNeighborhood && !hasProfileCity) {
      return res.json({ services: [], total: 0 });
    }

    // Mandatory 25km radius if location is known
    let locationFiltered = false;
    let radiusKm = 25; // Default hard limit

    // ▶ PRIORITY 1: GPS (Live) — 25km bounding box
    if (hasValidCoords && !city && !neighborhood) {
      radiusKm = parseRadius(radius || '25');
      if (req.user?.role !== 'admin' && radiusKm > 25) {
        radiusKm = 25;
      }
      const bbox = getBoundingBox(requestLat, requestLng, radiusKm);
      where.latitude = { gte: bbox.minLat, lte: bbox.maxLat };
      where.longitude = { gte: bbox.minLng, lte: bbox.maxLng };
      locationFiltered = true;
    } else if (!city && !neighborhood && !hasValidCoords) {
      // Profile fallback when no GPS and no explicit search params
      if (hasProfileNeighborhood) {
        // ▶ PRIORITY 2: Neighborhood
        const orConditions = [
          { neighborhood: { contains: req.user.neighborhood } }
        ];
        if (hasProfileCity) {
          orConditions.push({ city: { contains: req.user.city } });
        }
        where.OR = orConditions;
      } else if (hasProfileCity) {
        // ▶ PRIORITY 3: City
        where.OR = [
          { city: { contains: req.user.city } },
          { neighborhood: { contains: req.user.city } }
        ];
      }
    }

    const sortField = ['created_at', 'price', 'title'].includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [services, total] = await Promise.all([
      prisma.services.findMany({
        where,
        include: {
          users_services_provider_idTousers: {
            select: { name: true, email: true }
          }
        },
        orderBy: { [sortField]: sortOrder },
        skip: offset,
        take: limitNum
      }),
      prisma.services.count({ where })
    ]);

    const mappedServices = services.map(s => ({
      ...s,
      provider_name: s.users_services_provider_idTousers.name,
      provider_email: s.users_services_provider_idTousers.email
    }));

    // Apply exact distance filtering if location was provided
    let filteredServices = mappedServices;
    if (locationFiltered && requestLat && requestLng) {
      filteredServices = filterByDistance(
        mappedServices,
        requestLat,
        requestLng,
        radiusKm
      );
    }

    // Track search history (if user is authenticated)
    if (req.user?.id) {
      try {
        const filters = {
          price_min: price_min ? parseFloat(price_min) : null,
          price_max: price_max ? parseFloat(price_max) : null,
          radius: radiusKm,
          lat: requestLat,
          lng: requestLng
        };
        
        await prisma.user_search_history.create({
          data: {
            id: uuidv4(),
            user_id: req.user.id,
            category: category || null,
            city: city || null,
            neighborhood: neighborhood || null,
            filters: JSON.stringify(filters)
          }
        });
      } catch (error) {
        console.error('Error tracking search history:', error);
      }
    }

    res.json({
      services: filteredServices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      filters: {
        category: category || null,
        neighborhood: neighborhood || null,
        city: city || null,
        price_min: price_min ? parseFloat(price_min) : null,
        price_max: price_max ? parseFloat(price_max) : null,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng), radius: radiusKm } : null
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
    const { lat, lng, radius = '25', category, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!isValidLatLng(latitude, longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    let radiusKm = parseRadius(radius);
    // Enforce 25km limit
    if (radiusKm > 25) radiusKm = 25;
    
    const bbox = getBoundingBox(latitude, longitude, radiusKm);

    const where = {
      is_active: true,
      latitude: { gte: bbox.minLat, lte: bbox.maxLat },
      longitude: { gte: bbox.minLng, lte: bbox.maxLng }
    };

    if (category) where.category = category;

    const services = await prisma.services.findMany({
      where,
      include: {
        users_services_provider_idTousers: {
          select: { name: true, email: true }
        }
      },
      take: parseInt(limit)
    });

    const mappedServices = services.map(s => ({
      ...s,
      provider_name: s.users_services_provider_idTousers.name,
      provider_email: s.users_services_provider_idTousers.email
    }));

    // Filter by exact distance and sort
    const nearbyServices = filterByDistance(mappedServices, latitude, longitude, radiusKm);

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
        return await prisma.service_categories.findMany({
          where: { is_active: true },
          orderBy: { name: 'asc' }
        });
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
      // Prisma doesn't have a direct equivalent to SELECT DISTINCT with multiples and counts easily in one go
      // We can use groupBy which is cleaner
      const groups = await prisma.services.groupBy({
        by: ['neighborhood', 'city'],
        where: { neighborhood: { not: null } },
        _count: { _all: true }
      });
      
      let filteredGroups = groups;
      if (city) {
        filteredGroups = groups.filter(g => g.city === city);
      }
      
      return filteredGroups.map(g => ({
        neighborhood: g.neighborhood,
        city: g.city,
        service_count: g._count._all
      })).sort((a, b) => a.city.localeCompare(b.city) || a.neighborhood.localeCompare(b.neighborhood));
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
        const groups = await prisma.services.groupBy({
          by: ['city'],
          where: { city: { not: null } },
          _count: { _all: true }
        });
        
        return groups.map(g => ({
          city: g.city,
          service_count: g._count._all
        })).sort((a, b) => a.city.localeCompare(b.city));
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

