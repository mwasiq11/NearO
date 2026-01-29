import { useEffect } from 'react';
import { prefetchCategoryImages } from '@/services/unsplashService';
import { useAppSelector } from '@/store/hooks';

/**
 * Hook to prefetch Unsplash images for all categories on app load
 * This improves UX by having images ready when browsing services
 */
export const useImagePrefetch = () => {
  const { categories } = useAppSelector(state => state.listings);

  useEffect(() => {
    if (categories.length === 0) return;

    const categoryNames = categories.map(c => c.name);
    
    // Prefetch images in the background
    prefetchCategoryImages(categoryNames).catch(err => {
      console.error('Failed to prefetch category images:', err);
    });
  }, [categories]);
};
