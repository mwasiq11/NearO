import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListings } from '@/hooks/useListings';
import { formatPrice } from '@/utils/formatters';
import { Plus } from 'lucide-react';

const MyServicesPage = () => {
  const navigate = useNavigate();
  const { myListings, removeListing, isLoading } = useListings();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My services</h2>
          <p className="text-muted-foreground">Manage the services you provide.</p>
        </div>
        <Button variant="hero" onClick={() => navigate('/dashboard/my-services/new')}>
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading services...</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {myListings.map((listing) => (
          <Card key={listing.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
              <Badge variant="outline">{listing.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
            <div className="text-primary font-semibold">{formatPrice(listing.price, listing.priceType)}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/listing/${listing.id}`)}>
                View
              </Button>
              <Button size="sm" variant="destructive" onClick={() => removeListing(listing.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {!isLoading && myListings.length === 0 && (
        <div className="text-sm text-muted-foreground">No services yet. Create your first one.</div>
      )}
    </div>
  );
};

export default MyServicesPage;

