import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListings } from '@/hooks/useListings';
import { formatPrice } from '@/utils/formatters';
import { Search, MapPin } from 'lucide-react';

const BrowsePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, filteredListings, isLoading, updateFilters, searchServices } = useListings();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [neighborhood, setNeighborhood] = useState(searchParams.get('neighborhood') || '');

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
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Browse services</h2>
        <p className="text-muted-foreground">Find trusted local help and book instantly.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
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
          <Input
            placeholder="Neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
        </div>
        <Button variant="hero" onClick={handleSearch}>
          Search
        </Button>
      </Card>

      {isLoading && <div className="text-sm text-muted-foreground">Loading services...</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <Card
            key={listing.id}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate(`/dashboard/listing/${listing.id}`)}
          >
            <div className="aspect-video bg-muted">
              {listing.images[0] ? (
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {listing.location.neighborhood}
                </div>
                <Badge variant="outline">{listing.category}</Badge>
              </div>
              <div className="font-semibold text-primary">
                {formatPrice(listing.price, listing.priceType)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!isLoading && listings.length === 0 && (
        <div className="text-sm text-muted-foreground">No services found.</div>
      )}
    </div>
  );
};

export default BrowsePage;

