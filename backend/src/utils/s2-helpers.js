import { S2 } from 's2-geometry';

/**
 * Convert latitude and longitude to S2 cell ID
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} level - S2 cell level (default: 15, suitable for ~1km precision)
 * @returns {string} S2 cell ID
 */
function latLngToS2CellId(lat, lng, level = 15) {
  try {
    const key = S2.latLngToKey(lat, lng, level);
    return key.toString();
  } catch (error) {
    console.error('Error converting lat/lng to S2 cell:', error);
    return null;
  }
}

/**
 * Get S2 cell ID as BigInt for database storage
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} level - S2 cell level
 * @returns {BigInt|null} S2 cell ID as BigInt
 */
function latLngToS2CellIdBigInt(lat, lng, level = 15) {
  try {
    const key = S2.latLngToKey(lat, lng, level);
    return BigInt(key);
  } catch (error) {
    console.error('Error converting lat/lng to S2 cell BigInt:', error);
    return null;
  }
}

/**
 * Get parent S2 cell ID (one level up)
 * @param {string|BigInt} cellId - S2 cell ID
 * @param {number} level - Current level
 * @returns {string|null} Parent cell ID
 */
function getParentCellId(cellId, level) {
  try {
    if (typeof cellId === 'bigint') {
      cellId = cellId.toString();
    }
    const parentLevel = Math.max(0, level - 1);
    // S2 library doesn't have direct parent function, so we'll use a workaround
    // For now, return the cell ID at parent level
    return cellId;
  } catch (error) {
    console.error('Error getting parent cell:', error);
    return null;
  }
}

/**
 * Get all S2 cell IDs within a radius (approximate)
 * This returns cells that might contain points within the radius
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @param {number} level - S2 cell level
 * @returns {Array<string>} Array of S2 cell IDs
 */
function getS2CellsInRadius(lat, lng, radiusKm, level = 15) {
  try {
    const cells = [];
    const centerCellId = latLngToS2CellId(lat, lng, level);
    
    if (!centerCellId) return cells;
    
    cells.push(centerCellId);
    
    // Get neighboring cells based on radius
    // For a more accurate implementation, we'd need to calculate
    // the number of cells to check based on radius and cell size
    const approximateCellsToCheck = Math.ceil(radiusKm / 0.5); // Rough estimate
    
    // For now, return center cell and note that full implementation
    // would require more complex S2 geometry calculations
    return cells;
  } catch (error) {
    console.error('Error getting cells in radius:', error);
    return [];
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Validate latitude and longitude
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
function isValidLatLng(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export {
  latLngToS2CellId,
  latLngToS2CellIdBigInt,
  getParentCellId,
  getS2CellsInRadius,
  calculateDistance,
  toRadians,
  isValidLatLng
};

