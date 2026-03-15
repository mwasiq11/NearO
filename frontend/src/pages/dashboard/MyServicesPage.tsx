import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListings } from '@/hooks/useListings';
import { formatPrice } from '@/utils/formatters';
import { getCategoryImage } from '@/utils/categoryImages';
import { Plus, MapPin } from 'lucide-react';

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
        {myListings.map((listing) => {
          const imageUrl = listing.images[0] || getCategoryImage(listing.category);
          
          let locationText = 'Location not specified';
          if (listing.location.neighborhood && listing.location.city) {
            locationText = `${listing.location.neighborhood}, ${listing.location.city}`;
          } else if (listing.location.city) {
            locationText = listing.location.city;
          } else if (listing.location.neighborhood) {
            locationText = listing.location.neighborhood;
          }

          return (
            <Card key={listing.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div 
                className="aspect-video bg-muted cursor-pointer" 
                onClick={() => navigate(`/dashboard/listing/${listing.id}`)}
              >
                <img 
                  src={imageUrl} 
                  alt={listing.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getCategoryImage('Other');
                  }}
                />
              </div>
              <div className="p-4 space-y-3 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 
                    className="font-semibold line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/dashboard/listing/${listing.id}`)}
                  >
                    {listing.title}
                  </h3>
                  <Badge variant="outline" className="whitespace-nowrap">{listing.category}</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{listing.description}</p>
                
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{locationText}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t mt-auto">
                  <div className="text-primary font-semibold text-lg">{formatPrice(listing.price, listing.priceType)}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/listing/${listing.id}`)}>
                      View
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => removeListing(listing.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!isLoading && myListings.length === 0 && (
        <div className="text-sm text-muted-foreground">No services yet. Create your first one.</div>
      )}
    </div>
  );
};

export default MyServicesPage;

