// Category Emoji/Icon Mappings
export const CATEGORY_EMOJIS: Record<string, string> = {
  'Plumbing': '🔧',
  'Electrical': '⚡',
  'Cleaning': '🧹',
  'Gardening': '🌱',
  'Tutoring': '📚',
  'Pet Care': '🐾',
  'Repair': '🔨',
  'Delivery': '📦',
  'Cooking': '👨‍🍳',
  'Fitness': '💪',
  'Training': '🏋️',
  'Computing': '💻',
  'Web Development': '🌐',
  'Graphic Design': '🎨',
  'Photography': '📸',
  'Music Lessons': '🎵',
  'Beauty & Wellness': '💆',
  'Moving & Transportation': '🚚',
  'Automotive': '🚗',
  'Legal Services': '⚖️',
  'Other': '📋',
};

/**
 * Get emoji for a service category
 * @param category - The category name
 * @returns Emoji string
 */
export const getCategoryEmoji = (category: string): string => {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS['Other'];
};

/**
 * Get all categories with emojis
 */
export const getCategoriesWithEmojis = () => {
  return Object.entries(CATEGORY_EMOJIS).map(([name, emoji]) => ({
    name,
    emoji,
  }));
};
