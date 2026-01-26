import { 
  latLngToS2CellIdBigInt, 
  calculateDistance, 
  isValidLatLng 
} from './s2-helpers.js';

/**
 * Location utility functions for service discovery
 */

/**
 * Generate S2 cell ID for a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {BigInt|null} S2 cell ID
 */
function generateS2CellId(lat, lng) {
  if (!isValidLatLng(lat, lng)) {
    return null;
  }
  return latLngToS2CellIdBigInt(lat, lng, 15);
}

/**
 * Filter services by distance from a point
 * @param {Array} services - Array of services with lat/lng
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Filtered services with distance added
 */
function filterByDistance(services, centerLat, centerLng, radiusKm) {
  if (!isValidLatLng(centerLat, centerLng)) {
    return [];
  }

  return services
    .filter(service => {
      if (!service.latitude || !service.longitude) {
        return false;
      }
      const distance = calculateDistance(
        centerLat,
        centerLng,
        service.latitude,
        service.longitude
      );
      service.distance = distance;
      return distance <= radiusKm;
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get bounding box for a location and radius
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounding box {minLat, maxLat, minLng, maxLng}
 */
function getBoundingBox(lat, lng, radiusKm) {
  const R = 6371; // Earth's radius in kilometers
  const latDelta = radiusKm / R * (180 / Math.PI);
  const lngDelta = radiusKm / (R * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}

/**
 * Validate and normalize location data
 * @param {Object} location - Location object with lat/lng
 * @returns {Object|null} Normalized location or null if invalid
 */
function normalizeLocation(location) {
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return null;
  }

  if (!isValidLatLng(location.latitude, location.longitude)) {
    return null;
  }

  return {
    latitude: parseFloat(location.latitude.toFixed(8)),
    longitude: parseFloat(location.longitude.toFixed(8)),
    s2_cell_id: generateS2CellId(location.latitude, location.longitude),
    neighborhood: location.neighborhood || null,
    city: location.city || null
  };
}

/**
 * Parse radius string to kilometers
 * @param {string|number} radius - Radius (e.g., "5km", "10km", 5)
 * @returns {number} Radius in kilometers
 */
function parseRadius(radius) {
  if (typeof radius === 'number') {
    return radius;
  }

  if (typeof radius === 'string') {
    const match = radius.match(/(\d+)\s*(km|m)?/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = (match[2] || 'km').toLowerCase();
      return unit === 'm' ? value / 1000 : value;
    }
  }

  return 10; // Default 10km
}

export {
  generateS2CellId,
  filterByDistance,
  getBoundingBox,
  normalizeLocation,
  parseRadius,
  isValidLatLng,
  calculateDistance
};

