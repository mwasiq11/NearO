import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setListings,
  setFeaturedListings,
  setTrendingListings,
  setCategories,
  setMyListings,
  addListing,
  updateListing,
  deleteListing,
  setCurrentListing,
  setFilters,
  clearFilters,
  setLoading,
} from '@/store/slices/listingsSlice';
import { ServiceListing, SearchFilters, ListingForm, ServiceCategory } from '@/models/types';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const useListings = () => {
  const dispatch = useAppDispatch();
  const { listings, myListings, categories, currentListing, filters, isLoading, featuredListings, trendingListings } = useAppSelector(
    state => state.listings
  );
  const { user } = useAppSelector(state => state.auth);

  const mapService = useCallback((service: any): ServiceListing => {
    // Helper to check if a value is actually valid (not null, undefined, empty, or 'Unknown')
    const isValidValue = (val: any) => val && val !== 'Unknown' && val.trim() !== '';
    
    // Process location data - preserve actual values, don't default to 'Unknown'
    const neighborhood = isValidValue(service.neighborhood) ? service.neighborhood : '';
    const city = isValidValue(service.city) ? service.city : '';
    
    return {
      id: service.id,
      providerId: service.provider_id,
      title: service.title,
      description: service.description,
      category: service.category,
      price: Number(service.price),
      priceType: 'fixed',
      images: service.image_url ? [service.image_url] : (service.images || []),
      availability: [],
      location: {
        neighborhood: neighborhood,
        city: city,
        radius: 10,
        coordinates: service.latitude && service.longitude ? {
          lat: Number(service.latitude),
          lng: Number(service.longitude),
        } : undefined,
      },
      tags: service.tags || [],
      rating: Number(service.rating || 0),
      reviewCount: Number(service.review_count || 0),
      bookingCount: Number(service.booking_count || 0),
      isActive: Boolean(service.is_active ?? true),
      isTrending: Boolean(service.is_trending ?? false),
      createdAt: service.created_at || new Date().toISOString(),
      updatedAt: service.updated_at || service.created_at || new Date().toISOString(),
    };
  }, []);

  const mapCategory = useCallback((category: any): ServiceCategory => {
    return {
      id: category.id || category.name,
      name: category.name,
      icon: category.icon || '🛠️',
      description: category.description || '',
    };
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      dispatch(setLoading(true));
      try {
        const [services, trending, categoryData] = await Promise.all([
          api.get<any[]>('/services'),
          api.get<{ services: any[] }>('/discover/trending').catch(() => ({ services: [] })),
          api.get<{ categories: any[] }>('/search/categories').catch(() => ({ categories: [] })),
        ]);

        const mappedServices = services.map(mapService);
        const mappedTrending = (trending.services || []).map(mapService);
        const mappedCategories = (categoryData.categories || []).map(mapCategory);
        
        // Ensure 'Other' category exists for the Create Service form
        if (!mappedCategories.some(c => c.name.toLowerCase() === 'other')) {
          mappedCategories.push({
            id: 'other',
            name: 'Other',
            icon: '📦',
            description: 'Other undocumented services'
          });
        }

        dispatch(setListings(mappedServices));
        dispatch(setTrendingListings(mappedTrending));
        dispatch(setFeaturedListings(mappedServices.filter(l => l.rating >= 4.8)));
        dispatch(setCategories(mappedCategories));
      } catch (err) {
        toast.error('Failed to load services');
      } finally {
        dispatch(setLoading(false));
      }
    };

    loadInitialData();
  }, [dispatch, mapCategory, mapService]);

  // Filter listings based on current filters
  const filteredListings = useMemo(() => {
    let result = [...listings];
    
    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        l =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // Category filter
    if (filters.category) {
      result = result.filter(l => l.category === filters.category);
    }
    
    // Price range filter
    if (filters.priceMin !== undefined) {
      result = result.filter(l => l.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      result = result.filter(l => l.price <= filters.priceMax!);
    }
    
    // Rating filter
    if (filters.rating) {
      result = result.filter(l => l.rating >= filters.rating!);
    }
    
    // Neighborhood filter
    if (filters.neighborhood) {
      result = result.filter(l => l.location.neighborhood === filters.neighborhood);
    }
    
    // Sorting
    switch (filters.sortBy) {
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'trending':
        result.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
        break;
      default:
        // Relevance - sort by rating and booking count
        result.sort((a, b) => (b.rating * b.bookingCount) - (a.rating * a.bookingCount));
    }
    
    return result;
  }, [listings, filters]);

  const createListing = useCallback(async (form: ListingForm): Promise<ServiceListing | null> => {
    if (!user) {
      toast.error('Please login to create a listing');
      return null;
    }
    
    dispatch(setLoading(true));
    
    try {
      const payload = {
        provider_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category,
        price: form.price,
        availability: form.tags?.join(', ') || 'Available',
        neighborhood: form.neighborhood || user.neighborhood,
        city: form.city || user.city,
        latitude: form.latitude,
        longitude: form.longitude,
        image_url: form.image_url,
      };

      const created = await api.post<any>('/services', payload, { auth: true });
      const newListing = mapService(created);

      dispatch(addListing(newListing));
      toast.success('Listing created successfully!');
      return newListing;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create listing';
      toast.error(message);
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, mapService, user]);

  useEffect(() => {
    if (!user) {
      dispatch(setMyListings([]));
      return;
    }
    dispatch(setMyListings(listings.filter(l => l.providerId === user.id)));
  }, [dispatch, listings, user]);

  const editListing = useCallback(async (id: string, updates: Partial<ServiceListing>): Promise<boolean> => {
    dispatch(setLoading(true));
    
    try {
      const existing = listings.find(l => l.id === id);
      if (!existing) {
        toast.error('Listing not found');
        return false;
      }

      const payload: Record<string, any> = {
        title: updates.title,
        description: updates.description,
        category: updates.category,
        price: updates.price,
        availability: updates.tags?.join(', '),
        neighborhood: updates.location?.neighborhood,
        city: updates.location?.city,
      };

      const updated = await api.put<any>(`/services/${id}`, payload, { auth: true });
      dispatch(updateListing(mapService(updated)));
      toast.success('Listing updated!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update listing';
      toast.error(message);
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, listings, mapService]);

  const removeListing = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/services/${id}`, undefined, { auth: true });
      dispatch(deleteListing(id));
      toast.success('Listing deleted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete listing';
      toast.error(message);
      return false;
    }
  }, [dispatch]);

  const selectListing = useCallback((listing: ServiceListing | null) => {
    dispatch(setCurrentListing(listing));
  }, [dispatch]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const getListingById = useCallback((id: string): ServiceListing | undefined => {
    return listings.find(l => l.id === id);
  }, [listings]);

  const getListingsByCategory = useCallback((category: string): ServiceListing[] => {
    return listings.filter(l => l.category === category);
  }, [listings]);

  const searchServices = useCallback(async (searchFilters: Partial<SearchFilters> = {}) => {
    const params = new URLSearchParams();
    const combined = { ...filters, ...searchFilters };

    if (combined.category) params.append('category', combined.category);
    if (combined.neighborhood) params.append('neighborhood', combined.neighborhood);
    if (combined.priceMin !== undefined) params.append('price_min', String(combined.priceMin));
    if (combined.priceMax !== undefined) params.append('price_max', String(combined.priceMax));
    if (combined.radius) params.append('radius', String(combined.radius));
    if (combined.sortBy) params.append('sort', combined.sortBy === 'price_low' ? 'price' : 'created_at');

    try {
      dispatch(setLoading(true));
      const result = await api.get<{ services: any[] }>(`/search/services?${params.toString()}`);
      dispatch(setListings(result.services.map(mapService)));
    } catch (err) {
      toast.error('Search failed');
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, filters, mapService]);

  return {
    listings,
    filteredListings,
    myListings,
    featuredListings,
    trendingListings,
    categories,
    currentListing,
    filters,
    isLoading,
    createListing,
    editListing,
    removeListing,
    selectListing,
    updateFilters,
    resetFilters,
    getListingById,
    getListingsByCategory,
    searchServices,
  };
};
