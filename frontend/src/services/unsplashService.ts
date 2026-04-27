/**
 * Unsplash API Service
 * Dynamically fetches high-quality images for service categories
 */

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    username: string;
  };
}

interface UnsplashSearchResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

// In-memory cache for images (persists during session)
const imageCache = new Map<string, string>();

// Category to search query mapping
const categorySearchTerms: Record<string, string> = {
  'Plumbing': 'plumber tools wrench pipe',
  'Electrical': 'electrician electrical wiring circuit',
  'Cleaning': 'cleaning service housekeeping',
  'Gardening': 'gardening landscaping plants garden',
  'Tutoring': 'teacher tutoring education study',
  'Pet Care': 'pet care dog cat veterinary',
  'Repair': 'repair tools maintenance fix',
  'Delivery': 'delivery service courier package',
  'Cooking': 'chef cooking kitchen professional',
  'Fitness': 'fitness gym workout personal trainer',
  'Training': 'business training workshop coaching',
  'Computing': 'computer laptop technology IT',
  'Web Development': 'web developer coding programming',
  'Graphic Design': 'graphic design creative adobe',
  'Photography': 'photographer camera photography professional',
  'Music Lessons': 'music teacher instrument lessons',
  'Beauty & Wellness': 'beauty salon spa wellness massage',
  'Moving & Transportation': 'moving truck transportation logistics',
  'Automotive': 'car mechanic automotive repair garage',
  'Legal Services': 'lawyer legal office justice',
  'Other': 'professional service business',
};

/**
 * Fetch random image from Unsplash for a category
 */
export async function fetchCategoryImage(category: string): Promise<string> {
  // Check cache first
  const cacheKey = category.toLowerCase();
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  try {
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn('Unsplash API key not configured');
      return getFallbackImage(category);
    }

    const searchTerm = categorySearchTerms[category] || category;
    
    // Use Unsplash Search API
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=landscape&content_filter=high`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data: UnsplashSearchResponse = await response.json();
    
    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular + '&w=400&q=80';
      
      // Cache the result
      imageCache.set(cacheKey, imageUrl);
      
      return imageUrl;
    }

    // No results, use fallback
    return getFallbackImage(category);
  } catch (error) {
    console.error(`Failed to fetch Unsplash image for ${category}:`, error);
    return getFallbackImage(category);
  }
}

/**
 * Prefetch images for all categories (call on app init)
 */
export async function prefetchCategoryImages(categories: string[]): Promise<void> {
  const promises = categories.map(category => 
    fetchCategoryImage(category).catch(err => {
      console.error(`Failed to prefetch ${category}:`, err);
      return getFallbackImage(category);
    })
  );
  
  await Promise.allSettled(promises);
}

/**
 * Get cached image URL (instant, no API call)
 */
export function getCachedCategoryImage(category: string): string | null {
  return imageCache.get(category.toLowerCase()) || null;
}

/**
 * Clear image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Fallback images (static Unsplash URLs)
 */
function getFallbackImage(category: string): string {
  const fallbacks: Record<string, string> = {
    'Plumbing': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80',
    'Electrical': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    'Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    'Gardening': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
    'Tutoring': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
    'Pet Care': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
    'Repair': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    'Delivery': 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=80',
    'Cooking': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
    'Fitness': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    'Training': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    'Computing': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    'Web Development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    'Graphic Design': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80',
    'Photography': 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80',
    'Music Lessons': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
    'Beauty & Wellness': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    'Moving & Transportation': 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=80',
    'Automotive': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    'Legal Services': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
    'Other': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
  };

  return fallbacks[category] || fallbacks['Other'];
}

/**
 * Get image attribution for display (Unsplash requires attribution)
 */
export function getImageAttribution(imageUrl: string): string | null {
  // Extract photographer info from cached images if available
  // For simplicity, return generic attribution
  return 'Photo by Unsplash';
}
