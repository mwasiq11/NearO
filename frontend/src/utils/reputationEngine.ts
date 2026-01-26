/**
 * Reputation Engine for NearO
 * 
 * This algorithm rewards long-term reliability over one-off reviews.
 * Key principles:
 * 1. Recent reviews have slightly more weight, but consistent performance over time is valued more
 * 2. Review frequency matters - users who complete more transactions build trust faster
 * 3. Completion rate and response rate are factored in
 * 4. Decay factor prevents old bad reviews from haunting users forever, but slowly
 * 5. Bonus for consistency (low variance in ratings over time)
 */

import { Review, ReputationScore } from '@/models/types';

interface ReviewWithAge extends Review {
  ageInDays: number;
}

// Constants for the algorithm
const RECENCY_WEIGHT = 0.15; // How much to weight recent reviews
const CONSISTENCY_BONUS = 0.2; // Bonus for consistent ratings
const FREQUENCY_BONUS = 0.1; // Bonus for high transaction volume
const MIN_REVIEWS_FOR_BADGE = 10;
const GOLD_THRESHOLD = 4.7;
const SILVER_THRESHOLD = 4.3;
const BRONZE_THRESHOLD = 3.8;

/**
 * Calculate the time-weighted score for a single review
 * More recent reviews have slightly higher weight, but effect is mild
 */
const calculateTimeWeightedScore = (review: ReviewWithAge): number => {
  // Decay factor: reviews lose at most 30% of their weight over 2 years
  const maxDecay = 0.3;
  const decayPeriodDays = 730; // 2 years
  const decayFactor = Math.max(1 - (review.ageInDays / decayPeriodDays) * maxDecay, 1 - maxDecay);
  
  return review.rating * decayFactor;
};

/**
 * Calculate consistency score (inverse of standard deviation)
 * Users with consistent ratings get a bonus
 */
const calculateConsistencyScore = (ratings: number[]): number => {
  if (ratings.length < 3) return 0;
  
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) / ratings.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower variance = higher consistency score (0 to 1)
  // Max stdDev for ratings 1-5 is about 2
  return Math.max(0, 1 - (stdDev / 2));
};

/**
 * Calculate frequency bonus based on number of completed transactions
 * More transactions = higher trust
 */
const calculateFrequencyBonus = (reviewCount: number): number => {
  // Logarithmic scale - diminishing returns after many reviews
  // 0 reviews = 0, 10 reviews = ~0.5, 50 reviews = ~0.85, 100+ reviews = ~1
  return Math.min(Math.log10(reviewCount + 1) / 2, 1);
};

/**
 * Determine trend based on recent vs older reviews
 */
const calculateTrend = (reviews: ReviewWithAge[]): 'up' | 'down' | 'stable' => {
  if (reviews.length < 5) return 'stable';
  
  // Compare last 30 days vs previous 30-90 days
  const recentReviews = reviews.filter(r => r.ageInDays <= 30);
  const olderReviews = reviews.filter(r => r.ageInDays > 30 && r.ageInDays <= 90);
  
  if (recentReviews.length < 2 || olderReviews.length < 2) return 'stable';
  
  const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
  const olderAvg = olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length;
  
  const difference = recentAvg - olderAvg;
  
  if (difference > 0.2) return 'up';
  if (difference < -0.2) return 'down';
  return 'stable';
};

/**
 * Determine badge level based on overall score and review count
 */
const determineBadge = (score: number, reviewCount: number): 'gold' | 'silver' | 'bronze' | 'new' => {
  if (reviewCount < MIN_REVIEWS_FOR_BADGE) return 'new';
  if (score >= GOLD_THRESHOLD) return 'gold';
  if (score >= SILVER_THRESHOLD) return 'silver';
  if (score >= BRONZE_THRESHOLD) return 'bronze';
  return 'new';
};

/**
 * Main function to calculate reputation score
 */
export const calculateReputationScore = (
  reviews: Review[],
  completionRate: number = 100,
  responseRate: number = 100
): ReputationScore => {
  const now = new Date();
  
  // Add age in days to each review
  const reviewsWithAge: ReviewWithAge[] = reviews.map(review => ({
    ...review,
    ageInDays: Math.floor((now.getTime() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
  }));
  
  // Handle edge case of no reviews
  if (reviewsWithAge.length === 0) {
    return {
      overall: 0,
      totalReviews: 0,
      reliabilityScore: 0,
      responseRate,
      completionRate,
      badge: 'new',
      recentTrend: 'stable',
    };
  }
  
  // Calculate base weighted average
  const totalWeight = reviewsWithAge.reduce((sum, r) => {
    const maxDecay = 0.3;
    const decayPeriodDays = 730;
    return sum + Math.max(1 - (r.ageInDays / decayPeriodDays) * maxDecay, 1 - maxDecay);
  }, 0);
  
  const weightedSum = reviewsWithAge.reduce((sum, r) => sum + calculateTimeWeightedScore(r), 0);
  const baseScore = weightedSum / totalWeight;
  
  // Calculate bonuses
  const ratings = reviews.map(r => r.rating);
  const consistencyScore = calculateConsistencyScore(ratings);
  const frequencyBonus = calculateFrequencyBonus(reviews.length);
  
  // Combine scores
  // Base score makes up 70%, consistency 15%, frequency 10%, response/completion 5%
  const rateBonus = ((responseRate + completionRate) / 200) * 0.05;
  
  let finalScore = baseScore * 0.7 +
    (consistencyScore * CONSISTENCY_BONUS * 5) + // Scale to 0-1
    (frequencyBonus * FREQUENCY_BONUS * 5) + // Scale to 0-1
    (rateBonus * 5);
  
  // Clamp to 0-5 range
  finalScore = Math.min(5, Math.max(0, finalScore));
  
  // Calculate reliability score (0-100) - emphasizes long-term behavior
  const reliabilityScore = Math.round(
    (consistencyScore * 40) + // Consistency is 40% of reliability
    (frequencyBonus * 30) + // Transaction volume is 30%
    ((completionRate / 100) * 20) + // Completion rate is 20%
    ((responseRate / 100) * 10) // Response rate is 10%
  );
  
  return {
    overall: Math.round(finalScore * 10) / 10, // Round to 1 decimal
    totalReviews: reviews.length,
    reliabilityScore: Math.min(100, reliabilityScore),
    responseRate,
    completionRate,
    badge: determineBadge(finalScore, reviews.length),
    recentTrend: calculateTrend(reviewsWithAge),
  };
};

/**
 * Format reputation score for display
 */
export const formatReputationDisplay = (score: ReputationScore): string => {
  if (score.totalReviews === 0) return 'New Provider';
  return `${score.overall.toFixed(1)} (${score.totalReviews} reviews)`;
};

/**
 * Get badge color class
 */
export const getBadgeColorClass = (badge: ReputationScore['badge']): string => {
  switch (badge) {
    case 'gold': return 'badge-gold';
    case 'silver': return 'badge-silver';
    case 'bronze': return 'badge-bronze';
    default: return 'bg-muted text-muted-foreground';
  }
};

/**
 * Get trend indicator
 */
export const getTrendIndicator = (trend: ReputationScore['recentTrend']): { icon: string; color: string } => {
  switch (trend) {
    case 'up': return { icon: '↑', color: 'text-success' };
    case 'down': return { icon: '↓', color: 'text-destructive' };
    default: return { icon: '→', color: 'text-muted-foreground' };
  }
};
