import {
  Wrench,
  Zap,
  Sparkles,
  Leaf,
  GraduationCap,
  Dog,
  Hammer,
  Package,
  ChefHat,
  Dumbbell,
  Monitor,
  Globe,
  Palette,
  Camera,
  Music,
  HeartPulse,
  Truck,
  Car,
  Scale,
  ClipboardList
} from 'lucide-react';
import React from 'react';

// Category Emoji/Icon Mappings
export const CATEGORY_EMOJIS: Record<string, React.ElementType> = {
  'Plumbing': Wrench,
  'Electrical': Zap,
  'Cleaning': Sparkles,
  'Gardening': Leaf,
  'Tutoring': GraduationCap,
  'Pet Care': Dog,
  'Repair': Hammer,
  'Delivery': Package,
  'Cooking': ChefHat,
  'Fitness': Dumbbell,
  'Training': Dumbbell,
  'Computing': Monitor,
  'Web Development': Globe,
  'Graphic Design': Palette,
  'Photography': Camera,
  'Music Lessons': Music,
  'Beauty & Wellness': HeartPulse,
  'Moving & Transportation': Truck,
  'Automotive': Car,
  'Legal Services': Scale,
  'Other': ClipboardList,
};

/**
 * Get icon component for a service category
 * @param category - The category name
 * @returns Icon component
 */
export const getCategoryEmoji = (category: string): React.ElementType => {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS['Other'];
};

/**
 * Get all categories with icon components
 */
export const getCategoriesWithEmojis = () => {
  return Object.entries(CATEGORY_EMOJIS).map(([name, icon]) => ({
    name,
    icon,
  }));
};
