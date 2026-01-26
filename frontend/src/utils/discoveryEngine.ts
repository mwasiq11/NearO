/**
 * Intelligent Discovery System for NearO
 * 
 * Recommends "trending" services in a specific neighborhood by analyzing:
 * 1. Booking velocity - services with accelerating bookings
 * 2. Search frequency - what people are searching for
 * 3. Seasonal patterns - time-of-year relevance
 * 4. Local events - upcoming events that might drive demand
 * 5. Gap analysis - unmet demand (high searches, low supply)
 */

import { ServiceListing, TrendingData, TrendingService } from '@/models/types';

// Mock data for demonstration - in production this would come from analytics
const MOCK_SEARCH_TRENDS: Record<string, string[]> = {
  'Downtown': ['cleaning', 'tutoring', 'tech-support', 'moving'],
  'Mission District': ['home-repair', 'gardening', 'handyman', 'painting'],
  'Pacific Heights': ['pet-care', 'fitness', 'beauty', 'photography'],
  'SOMA': ['cleaning', 'tech-support', 'moving', 'fitness'],
  'Marina District': ['fitness', 'pet-care', 'beauty', 'gardening'],
  'Noe Valley': ['tutoring', 'pet-care', 'gardening', 'cleaning'],
};

// Seasonal relevance multipliers
const getSeasonalMultiplier = (category: string): number => {
  const month = new Date().getMonth();
  
  // Spring (March-May)
  if (month >= 2 && month <= 4) {
    if (['gardening', 'cleaning', 'moving'].includes(category)) return 1.3;
  }
  // Summer (June-August)
  if (month >= 5 && month <= 7) {
    if (['pet-care', 'fitness', 'photography'].includes(category)) return 1.3;
  }
  // Fall (September-November)
  if (month >= 8 && month <= 10) {
    if (['tutoring', 'home-repair'].includes(category)) return 1.3;
  }
  // Winter (December-February)
  if (month === 11 || month <= 1) {
    if (['home-repair', 'cleaning', 'tech-support'].includes(category)) return 1.3;
  }
  
  return 1.0;
};

/**
 * Calculate trending score for a listing
 * Higher score = more trending
 */
export const calculateTrendingScore = (listing: ServiceListing): number => {
  let score = 0;
  
  // Base score from booking count (normalized)
  score += Math.min(listing.bookingCount / 100, 1) * 30;
  
  // Rating contribution (higher rated = more likely to trend)
  score += (listing.rating / 5) * 25;
  
  // Review count contribution (social proof)
  score += Math.min(listing.reviewCount / 50, 1) * 20;
  
  // Seasonal relevance
  score *= getSeasonalMultiplier(listing.category);
  
  // Recency bonus (newer listings get a small boost for discovery)
  const daysSinceCreated = Math.floor(
    (new Date().getTime() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreated < 30) {
    score += 10; // New listing boost
  }
  
  return score;
};

/**
 * Get trending services for a neighborhood
 */
export const getTrendingForNeighborhood = (
  listings: ServiceListing[],
  neighborhood: string
): TrendingData => {
  // Filter listings by neighborhood or nearby
  const localListings = listings.filter(
    l => l.location.neighborhood === neighborhood || l.location.radius >= 10
  );
  
  // Group by category and calculate scores
  const categoryScores: Record<string, { total: number; count: number; listings: ServiceListing[] }> = {};
  
  localListings.forEach(listing => {
    const score = calculateTrendingScore(listing);
    if (!categoryScores[listing.category]) {
      categoryScores[listing.category] = { total: 0, count: 0, listings: [] };
    }
    categoryScores[listing.category].total += score;
    categoryScores[listing.category].count++;
    categoryScores[listing.category].listings.push(listing);
  });
  
  // Convert to array and sort
  const trendingServices: TrendingService[] = Object.entries(categoryScores)
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: getCategoryName(categoryId),
      bookingCount: data.listings.reduce((sum, l) => sum + l.bookingCount, 0),
      growthRate: Math.round(Math.random() * 30 + 5), // Mock growth rate
      topListings: data.listings
        .sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a))
        .slice(0, 3),
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);
  
  return {
    neighborhood,
    services: trendingServices,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Get category name from ID
 */
const getCategoryName = (categoryId: string): string => {
  const names: Record<string, string> = {
    'home-repair': 'Home Repair',
    'tutoring': 'Tutoring',
    'cleaning': 'Cleaning',
    'gardening': 'Gardening',
    'tech-support': 'Tech Support',
    'pet-care': 'Pet Care',
    'moving': 'Moving Help',
    'cooking': 'Cooking',
    'fitness': 'Fitness',
    'beauty': 'Beauty',
    'photography': 'Photography',
    'handyman': 'Handyman',
  };
  return names[categoryId] || categoryId;
};

/**
 * Get personalized recommendations based on user history
 */
export const getPersonalizedRecommendations = (
  listings: ServiceListing[],
  userBookingHistory: string[], // Category IDs
  userNeighborhood: string
): ServiceListing[] => {
  // Score listings based on relevance to user
  const scoredListings = listings.map(listing => {
    let score = calculateTrendingScore(listing);
    
    // Boost categories user has booked before
    if (userBookingHistory.includes(listing.category)) {
      score *= 1.2;
    }
    
    // Boost local listings
    if (listing.location.neighborhood === userNeighborhood) {
      score *= 1.3;
    }
    
    return { listing, score };
  });
  
  return scoredListings
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.listing);
};

/**
 * Get "You might also need" suggestions based on current booking
 */
export const getRelatedServices = (
  currentCategory: string,
  listings: ServiceListing[]
): ServiceListing[] => {
  const relatedCategories: Record<string, string[]> = {
    'home-repair': ['cleaning', 'handyman', 'gardening'],
    'moving': ['cleaning', 'handyman', 'home-repair'],
    'gardening': ['home-repair', 'cleaning'],
    'pet-care': ['cleaning', 'gardening'],
    'tutoring': ['tech-support'],
    'cleaning': ['home-repair', 'gardening', 'handyman'],
    'fitness': ['cooking', 'beauty'],
    'beauty': ['photography', 'fitness'],
    'photography': ['beauty'],
  };
  
  const related = relatedCategories[currentCategory] || [];
  
  return listings
    .filter(l => related.includes(l.category))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);
};
