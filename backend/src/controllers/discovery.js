import prisma from '../db/prisma.js';
import { calculateDistance, isValidLatLng } from '../utils/location.js';

const getTrendingServices = async (req, res) => {
  try {
    const { city, neighborhood, latitude, longitude, limit = 20 } = req.query;
    
    // Sanitize inputs
    const limitNum = parseInt(limit, 10) || 20;
    const safeLimit = Math.min(Math.max(limitNum, 1), 100);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const where = { is_active: true };

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = 25;
    
    const hasValidCoords = isValidLatLng(lat, lng);
    const hasProfileNeighborhood = !!req.user?.neighborhood;
    const hasProfileCity = !!req.user?.city;

    // ─── PRIORITY: GPS > Profile Neighborhood > Profile City ───
    // If NOTHING is available, return empty
    if (!hasValidCoords && !hasProfileNeighborhood && !hasProfileCity && !city && !neighborhood) {
      return res.json({ services: [] });
    }

    let locationSource = 'none';

    if (hasValidCoords) {
      // ▶ PRIORITY 1: GPS (Live Location) — 25km bounding box
      locationSource = 'gps';
      const latDelta = 0.225;
      const lngDelta = 0.225 / Math.cos(lat * Math.PI / 180);
      where.latitude = { gte: lat - latDelta, lte: lat + latDelta };
      where.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };
    } else if (neighborhood || hasProfileNeighborhood) {
      // ▶ PRIORITY 2: Neighborhood (from query or profile) — match services in/near that neighborhood
      locationSource = 'neighborhood';
      const targetNeighborhood = neighborhood || req.user.neighborhood;
      const targetCity = city || req.user?.city;

      // Search services whose neighborhood or city contains the target neighborhood
      const orConditions = [
        { neighborhood: { contains: targetNeighborhood } }
      ];
      // Also include services from the same city (neighborhoods are part of a city)
      if (targetCity) {
        orConditions.push({ city: { contains: targetCity } });
      }
      where.OR = orConditions;
    } else if (city || hasProfileCity) {
      // ▶ PRIORITY 3: City (from query or profile) — show all services in that city
      locationSource = 'city';
      const targetCity = city || req.user.city;
      where.OR = [
        { city: { contains: targetCity } },
        { neighborhood: { contains: targetCity } }
      ];
    }

    const services = await prisma.services.findMany({
      where,
      include: {
        bookings: {
          where: {
            created_at: { gte: sevenDaysAgo }
          },
          select: { id: true }
        },
        reviews: {
          select: { rating: true }
        }
      },
      take: 200 // Get a larger set to sort by trending weight
    });

    const mappedServices = services.map(s => {
      const recent_bookings = s.bookings.length;
      const avg_rating = s.reviews.length > 0 
        ? s.reviews.reduce((acc, r) => acc + r.rating, 0) / s.reviews.length 
        : 0;
      
      const trending_weight = (recent_bookings * 2) + (avg_rating * 1.5);
      
      return {
        ...s,
        recent_bookings,
        avg_rating,
        trending_weight
      };
    });

    // Exact distance filtering for GPS-based queries
    let filteredServices = mappedServices;
    if (hasValidCoords) {
      filteredServices = filteredServices.filter(s => {
        if (!s.latitude || !s.longitude) return false;
        
        // Haversine distance
        const R = 6371;
        const dLat = (parseFloat(s.latitude) - lat) * Math.PI / 180;
        const dLon = (parseFloat(s.longitude) - lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat * Math.PI / 180) * Math.cos(parseFloat(s.latitude) * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
        
        return distance <= radiusKm;
      });
    }

    filteredServices.sort((a, b) => b.trending_weight - a.trending_weight);
    
    res.json({ services: filteredServices.slice(0, safeLimit), locationSource });
  } catch (error) {
    console.error('Error getting trending services:', error);
    res.status(500).json({ error: error.message });
  }
};

const getRecommendedServices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get categories from past bookings
    const bookings = await prisma.bookings.findMany({
      where: { seeker_id: userId },
      include: { 
        services: { select: { category: true } } 
      }
    });

    const bookingCategories = new Map();
    bookings.forEach(b => {
      const cat = b.services.category;
      bookingCategories.set(cat, (bookingCategories.get(cat) || 0) + 1);
    });

    // Get categories from search history
    const searchHistory = await prisma.user_search_history.findMany({
      where: {
        user_id: userId,
        category: { not: null },
        created_at: { gte: thirtyDaysAgo }
      },
      orderBy: { created_at: 'desc' },
      take: 100
    });

    const searchCategories = new Map();
    searchHistory.forEach(s => {
      searchCategories.set(s.category, (searchCategories.get(s.category) || 0) + 1);
    });

    // Get preferred locations
    const locationPrefs = await prisma.user_search_history.groupBy({
      by: ['city', 'neighborhood'],
      where: {
        user_id: userId,
        created_at: { gte: thirtyDaysAgo }
      },
      _count: { _all: true },
      orderBy: { _count: { neighborhood: 'desc' } }, // neighborhood or any count field
      take: 3
    });

    // Combine categories
    const categoryMap = new Map();
    bookingCategories.forEach((count, cat) => {
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + count * 2);
    });
    searchCategories.forEach((count, cat) => {
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + count);
    });

    const sortedCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    if (sortedCategories.length === 0) {
      return getTrendingServices(req, res);
    }

    const where = {
      is_active: true,
      category: { in: sortedCategories }
    };

    if (locationPrefs.length > 0) {
      const pref = locationPrefs[0];
      if (pref.city) where.city = pref.city;
      if (pref.neighborhood) where.neighborhood = pref.neighborhood;
    }

    const services = await prisma.services.findMany({
      where,
      include: {
        reviews: { select: { rating: true } }
      },
      take: 100
    });

    const mappedServices = services.map(s => {
      const avg_rating = s.reviews.length > 0 
        ? s.reviews.reduce((acc, r) => acc + r.rating, 0) / s.reviews.length 
        : 0;
      return { ...s, avg_rating };
    });

    mappedServices.sort((a, b) => b.avg_rating - a.avg_rating);

    let basis = 'mixed';
    if (bookingCategories.size > 0 && searchCategories.size === 0) basis = 'past_bookings';
    else if (searchCategories.size > 0 && bookingCategories.size === 0) basis = 'search_history';
    else if (searchCategories.size > 0 && bookingCategories.size > 0) basis = 'bookings_and_searches';

    res.json({
      services: mappedServices.slice(0, parseInt(limit)),
      basis,
      insights: {
        categories_from_bookings: bookingCategories.size,
        categories_from_searches: searchCategories.size,
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
