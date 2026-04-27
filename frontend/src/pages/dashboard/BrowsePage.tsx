import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListings } from '@/hooks/useListings';
import { useImagePrefetch } from '@/hooks/useImagePrefetch';
import { formatPrice } from '@/utils/formatters';
import { getCategoryImage } from '@/utils/categoryImages';
import { SearchAutocomplete } from '@/components/common/SearchAutocomplete';
import { Autocomplete } from '@/components/common/Autocomplete';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from 'boneyard-js/react';
import { MapPin } from 'lucide-react';
import { api } from '@/lib/api';

const BrowsePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, filteredListings, isLoading, updateFilters, searchServices, listings: allListings } = useListings();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [neighborhood, setNeighborhood] = useState(searchParams.get('neighborhood') || '');
  const [neighborhoods, setNeighborhoods] = useState<Array<{ value: string; label: string; count: number }>>([]);
  const [visibleCount, setVisibleCount] = useState(12);

  // Debounce all search inputs
  const debouncedQuery = useDebounce(query, 500);
  const debouncedCategory = useDebounce(category, 300);
  const debouncedNeighborhood = useDebounce(neighborhood, 300);

  const updateFiltersRef = useRef(updateFilters);
  const searchServicesRef = useRef(searchServices);

  useEffect(() => {
    updateFiltersRef.current = updateFilters;
  }, [updateFilters]);

  useEffect(() => {
    searchServicesRef.current = searchServices;
  }, [searchServices]);

  // Auto-search when debounced values change
  useEffect(() => {
    const performSearch = async () => {
      updateFiltersRef.current({
        query: debouncedQuery,
        category: debouncedCategory || undefined,
        neighborhood: debouncedNeighborhood || undefined,
      });
      await searchServicesRef.current({
        query: debouncedQuery,
        category: debouncedCategory || undefined,
        neighborhood: debouncedNeighborhood || undefined,
      });
    };
    performSearch();
  }, [debouncedQuery, debouncedCategory, debouncedNeighborhood]);

  // Prefetch Unsplash images for all categories
  useImagePrefetch();

  // Fetch neighborhoods from backend
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        const response = await api.get<{ neighborhoods: Array<{ neighborhood: string; city: string; service_count: number }> }>('/search/neighborhoods');
        const neighborhoodOptions = response.neighborhoods.map(n => ({
          value: n.neighborhood,
          label: `${n.neighborhood}${n.city ? `, ${n.city}` : ''}`,
          count: n.service_count,
        }));
        setNeighborhoods(neighborhoodOptions);
      } catch (error) {
        console.error('Failed to fetch neighborhoods:', error);
      }
    };
    fetchNeighborhoods();
  }, []);

  // Generate search suggestions from available services
  const searchSuggestions = useMemo(() => {
    const suggestions: Array<{ type: 'service' | 'category' | 'tag'; value: string; label: string; count?: number }> = [];
    
    // Add service titles
    const serviceTitles = new Set<string>();
    allListings.forEach(listing => {
      if (!serviceTitles.has(listing.title.toLowerCase())) {
        serviceTitles.add(listing.title.toLowerCase());
        suggestions.push({
          type: 'service',
          value: listing.title,
          label: listing.title,
        });
      }
    });

    // Add categories with count
    const categoryCount = new Map<string, number>();
    allListings.forEach(listing => {
      categoryCount.set(listing.category, (categoryCount.get(listing.category) || 0) + 1);
    });
    categoryCount.forEach((count, cat) => {
      suggestions.push({
        type: 'category',
        value: cat,
        label: cat,
        count,
      });
    });

    // Add popular tags
    const tagCount = new Map<string, number>();
    allListings.forEach(listing => {
      listing.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });
    Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([tag, count]) => {
        suggestions.push({
          type: 'tag',
          value: tag,
          label: tag,
          count,
        });
      });

    return suggestions;
  }, [allListings]);

  const handleSearch = async () => {
    updateFilters({
      query,
      category: category || undefined,
      neighborhood: neighborhood || undefined,
    });
    await searchServices({
      query,
      category: category || undefined,
      neighborhood: neighborhood || undefined,
    });
  };

  const listings = useMemo(() => filteredListings, [filteredListings]);

  return (
    <div className="px-4 pt-3.5 pb-6 space-y-4 md:px-6 md:pt-4 md:space-y-6 lg:px-8 lg:pt-5 lg:space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Browse services</h2>
        <p className="text-muted-foreground">Find trusted local help and book instantly.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <SearchAutocomplete
            value={query}
            onValueChange={setQuery}
            suggestions={searchSuggestions}
            placeholder="Search services"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <Autocomplete
            options={neighborhoods}
            value={neighborhood}
            onValueChange={setNeighborhood}
            placeholder="Select neighborhood"
            searchPlaceholder="Search neighborhoods..."
            emptyMessage="No neighborhoods found."
            className="w-full"
          />
        </div>
        <Button variant="hero" onClick={handleSearch}>
          Search
        </Button>
      </Card>

      <Skeleton name="browse-listings" loading={isLoading}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.slice(0, visibleCount).map((listing) => {
            let imageUrl = listing.images[0] || getCategoryImage(listing.category);
            
            // Ensure we use optimized width if it's an Unsplash URL
            if (imageUrl.includes('unsplash.com') && !imageUrl.includes('w=')) {
              imageUrl += '&w=400&q=80';
            } else if (imageUrl.includes('unsplash.com') && imageUrl.includes('w=800')) {
              imageUrl = imageUrl.replace('w=800', 'w=400');
            }
            
            // Smart location display logic - show actual data or friendly message
            let locationText = 'Location not specified';
            if (listing.location.neighborhood && listing.location.city) {
              locationText = `${listing.location.neighborhood}, ${listing.location.city}`;
            } else if (listing.location.city) {
              locationText = listing.location.city;
            } else if (listing.location.neighborhood) {
              locationText = listing.location.neighborhood;
            }

            return (
              <Card
                key={listing.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/dashboard/listing/${listing.id}`)}
              >
                <div className="aspect-video bg-muted relative">
                  <img 
                    src={imageUrl} 
                    alt={listing.title} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = getCategoryImage('Other');
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={listing.isInStock ? 'success' : 'destructive'}
                      className="shadow-md border-none font-bold"
                    >
                      {listing.isInStock
                        ? listing.remainingQuantity === null || listing.remainingQuantity === undefined
                          ? 'Available'
                          : `${listing.remainingQuantity} left`
                        : 'Out of stock'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {locationText}
                    </div>
                    <Badge variant="outline">{listing.category}</Badge>
                  </div>
                  <div className="font-semibold text-primary">
                    {formatPrice(listing.price, listing.priceType, listing.currency)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Skeleton>

      {!isLoading && listings.length > visibleCount && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => setVisibleCount(prev => prev + 12)}
            className="w-full md:w-auto min-w-[200px]"
          >
            Load more services
          </Button>
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="text-sm text-muted-foreground">No services found.</div>
      )}
    </div>
  );
};

export default BrowsePage;

