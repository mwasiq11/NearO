import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useListings } from '@/hooks/useListings';
import { useBookings } from '@/hooks/useBookings';
import { formatPrice } from '@/utils/formatters';
import { getCategoryImage } from '@/utils/categoryImages';
import { Plus, MapPin, Calendar, Clock } from 'lucide-react';

const MyServicesPage = () => {
  const navigate = useNavigate();
  const { myListings, removeListing, isLoading: listingsLoading } = useListings();
  const { myBookings, isLoading: bookingsLoading } = useBookings();

  const isLoading = listingsLoading || bookingsLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My services</h2>
          <p className="text-muted-foreground text-lg">Manage your provided and purchased services.</p>
        </div>
        <Button variant="hero" onClick={() => navigate('/dashboard/my-services/new')} className="w-full sm:w-auto shadow-sm">
          <Plus className="h-5 w-5 mr-1" /> Add Service
        </Button>
      </div>

      {isLoading && <div className="text-sm font-medium text-muted-foreground animate-pulse">Loading services...</div>}

      <Tabs defaultValue="provided" className="w-full space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="provided" className="rounded-lg text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Provided Services</TabsTrigger>
          <TabsTrigger value="purchased" className="rounded-lg text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Purchased Services</TabsTrigger>
        </TabsList>

        <TabsContent value="provided" className="space-y-6 mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <Card key={listing.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 border-border/50 group bg-card">
                  <div 
                    className="aspect-video bg-muted cursor-pointer relative overflow-hidden" 
                    onClick={() => navigate(`/dashboard/listing/${listing.id}`)}
                  >
                    <img 
                      src={imageUrl} 
                      alt={listing.title} 
                      className="w-full h-full object-cover origin-center transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = getCategoryImage('Other');
                      }}
                    />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                       <Badge variant="secondary" className="shadow-sm backdrop-blur-md bg-background/80 hover:bg-background/90">{listing.category}</Badge>
                    </div>
                  </div>
                  <div className="p-5 space-y-4 flex flex-col flex-1">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 
                          className="font-semibold text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors duration-200"
                          onClick={() => navigate(`/dashboard/listing/${listing.id}`)}
                        >
                          {listing.title}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground/80 gap-1.5 font-medium">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{locationText}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">{listing.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                      <div className="text-primary font-semibold text-xl drop-shadow-sm">{formatPrice(listing.price, listing.priceType, listing.currency)}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="font-semibold shadow-sm hover:bg-secondary/20" onClick={() => navigate(`/dashboard/listing/${listing.id}`)}>
                          View
                        </Button>
                        <Button size="sm" variant="destructive" className="font-semibold shadow-sm" onClick={() => removeListing(listing.id)}>
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
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-muted/10">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-1">No services yet</h3>
              <p className="text-muted-foreground mb-4">Start sharing your skills with the community.</p>
              <Button onClick={() => navigate('/dashboard/my-services/new')} variant="hero">Create your first service</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchased" className="space-y-6 mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {myBookings.map((booking) => {
               const imageUrl = booking.serviceImageUrl || getCategoryImage(booking.serviceCategory || 'Other');
               
               return (
                 <Card key={booking.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 border-border/50 group bg-card">
                   <div 
                     className="aspect-video bg-muted cursor-pointer relative overflow-hidden" 
                     onClick={() => navigate(`/dashboard/bookings/${booking.id}`)}
                   >
                     <img 
                       src={imageUrl} 
                       alt={booking.serviceTitle} 
                       className="w-full h-full object-cover origin-center transition-transform duration-500 group-hover:scale-105"
                       onError={(e) => { e.currentTarget.src = getCategoryImage('Other'); }}
                     />
                     <div className="absolute top-3 left-3">
                       <Badge className="bg-background/90 text-foreground capitalize font-semibold shadow-sm backdrop-blur-md px-2.5 py-0.5">
                         {booking.status.replace('_', ' ')}
                       </Badge>
                     </div>
                   </div>
                   <div className="p-5 space-y-4 flex flex-col flex-1">
                     <h3 
                       className="font-semibold text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors duration-200"
                       onClick={() => navigate(`/dashboard/bookings/${booking.id}`)}
                     >
                       {booking.serviceTitle}
                     </h3>
                     
                     <div className="space-y-2.5 bg-muted/40 p-3 rounded-lg border border-border/50">
                       <div className="flex items-center text-sm text-foreground gap-2 font-medium">
                         <Calendar className="h-4 w-4 text-primary/80" />
                         <span>{new Date(booking.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</span>
                       </div>
                       <div className="flex items-center text-sm text-foreground gap-2 font-medium">
                         <Clock className="h-4 w-4 text-primary/80" />
                         <span>{booking.scheduledTime}</span>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                        <div className="text-primary font-semibold text-xl drop-shadow-sm">{formatPrice(booking.totalPrice, 'fixed', booking.serviceCurrency)}</div>
                       <Button size="sm" variant="hero" className="font-semibold shadow-sm" onClick={() => navigate(`/dashboard/bookings/${booking.id}`)}>
                         Manage
                       </Button>
                     </div>
                   </div>
                 </Card>
               );
            })}
          </div>
          {!isLoading && myBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-muted/10">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-1">No purchased services</h3>
              <p className="text-muted-foreground mb-4">You haven't booked any services yet. Explore what's available!</p>
              <Button onClick={() => navigate('/dashboard/explore')} variant="outline" className="font-semibold">Explore services</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyServicesPage;
