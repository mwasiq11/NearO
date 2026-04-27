import { getCachedCategoryImage, fetchCategoryImage } from '@/services/unsplashService';

// Category Image Mappings - Using Unsplash for high-quality, free images
export const CATEGORY_IMAGES = {
  'Plumbing': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&q=80',
  'Electrical': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
  'Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
  'Gardening': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
  'Tutoring': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
  'Pet Care': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80',
  'Repair': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
  'Delivery': 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&q=80',
  'Cooking': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80',
  'Fitness': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
  'Training': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80',
  'Computing': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
  'Web Development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80',
  'Graphic Design': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=80',
  'Photography': 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&q=80',
  'Music Lessons': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80',
  'Beauty & Wellness': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
  'Moving & Transportation': 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&q=80',
  'Automotive': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
  'Legal Services': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80',
  'Other': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&q=80',
};

/**
 * Normalize category name for matching
 * Handles case-insensitive matching and common variations
 */
const normalizeCategory = (category: string): string => {
  const normalized = category.trim().toLowerCase();
  
  // Map common variations to standard category names
  const variations: Record<string, string> = {
    'test': 'Other',
    'testing': 'Other',
    'garden': 'Gardening',
    'gardens': 'Gardening',
    'fitness training': 'Fitness',
    'personal training': 'Fitness',
    'workout': 'Fitness',
    'gym': 'Fitness',
    'tutor': 'Tutoring',
    'education': 'Tutoring',
    'teaching': 'Tutoring',
    'pets': 'Pet Care',
    'pet sitting': 'Pet Care',
    'dog walking': 'Pet Care',
    'electric': 'Electrical',
    'electrician': 'Electrical',
    'plumber': 'Plumbing',
    'cleaning service': 'Cleaning',
    'house cleaning': 'Cleaning',
    'web dev': 'Web Development',
    'website': 'Web Development',
    'coding': 'Web Development',
    'design': 'Graphic Design',
    'photo': 'Photography',
    'music': 'Music Lessons',
    'moving': 'Moving & Transportation',
    'transport': 'Moving & Transportation',
    'car repair': 'Automotive',
    'auto': 'Automotive',
    'legal': 'Legal Services',
    'lawyer': 'Legal Services',
    'beauty': 'Beauty & Wellness',
    'wellness': 'Beauty & Wellness',
    'spa': 'Beauty & Wellness',
  };
  
  // Check if we have a direct variation match
  if (variations[normalized]) {
    return variations[normalized];
  }
  
  // Try to find a case-insensitive match in CATEGORY_IMAGES
  const categoryKeys = Object.keys(CATEGORY_IMAGES);
  const exactMatch = categoryKeys.find(key => key.toLowerCase() === normalized);
  
  return exactMatch || 'Other';
};

/**
 * Get image URL for a service category
 * First checks Unsplash API cache, then falls back to static images
 * @param category - The category name
 * @returns Image URL from Unsplash or fallback
 */
export const getCategoryImage = (category: string): string => {
  const normalizedCategory = normalizeCategory(category);
  
  // Try to get cached Unsplash image first
  const cachedImage = getCachedCategoryImage(normalizedCategory);
  if (cachedImage) {
    return cachedImage;
  }
  
  // Fall back to static images
  return CATEGORY_IMAGES[normalizedCategory as keyof typeof CATEGORY_IMAGES] || CATEGORY_IMAGES['Other'];
};

/**
 * Async version - fetches from Unsplash API if not cached
 * Use this for initial load or when you can handle async
 * @param category - The category name
 * @returns Promise with image URL
 */
export const getCategoryImageAsync = async (category: string): Promise<string> => {
  const normalizedCategory = normalizeCategory(category);
  
  try {
    // This will fetch from Unsplash API and cache the result
    const imageUrl = await fetchCategoryImage(normalizedCategory);
    return imageUrl;
  } catch (error) {
    console.error('Failed to fetch category image:', error);
    // Fall back to static image
    return CATEGORY_IMAGES[normalizedCategory as keyof typeof CATEGORY_IMAGES] || CATEGORY_IMAGES['Other'];
  }
};

/**
 * Get all category names with images
 */
export const getCategoriesWithImages = () => {
  return Object.keys(CATEGORY_IMAGES);
};
