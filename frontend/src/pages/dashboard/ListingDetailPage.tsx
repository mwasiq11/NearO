import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useListings } from '@/hooks/useListings';
import { useBookings } from '@/hooks/useBookings';
import { useChat } from '@/hooks/useChat';
import { useAppSelector } from '@/store/hooks';
import { api } from '@/lib/api';
import { ServiceListing } from '@/models/types';
import { formatPrice } from '@/utils/formatters';
import { getCategoryImage } from '@/utils/categoryImages';
import { MapPin, MessageSquare, Star, Clock, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getListingById } = useListings();
  const { createBooking } = useBookings();
  const { startConversation } = useChat();
  const { user } = useAppSelector(state => state.auth);
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    duration: '60',
    notes: '',
  });

  useEffect(() => {
    if (!id) return;
    const existing = getListingById(id);
    if (existing) {
      setListing(existing);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const service = await api.get<any>(`/services/${id}`);
        const mapped: ServiceListing = {
          id: service.id,
          providerId: service.provider_id,
          title: service.title,
          description: service.description,
          category: service.category,
          price: Number(service.price),
          priceType: 'fixed',
          images: service.images || [],
          availability: [],
          location: {
            neighborhood: service.neighborhood || '',
            city: service.city || '',
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
        setListing(mapped);
      } catch (err) {
        toast.error('Failed to load service');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [getListingById, id]);

  const canBook = useMemo(() => Boolean(listing), [listing]);

  const handleBooking = async () => {
    if (!listing) return;
    if (!bookingData.date || !bookingData.time) {
      toast.error('Select a date and time');
      return;
    }
    const created = await createBooking(
      listing,
      bookingData.date,
      bookingData.time,
      Number(bookingData.duration || 60),
      bookingData.notes || undefined
    );
    if (created) {
      navigate('/dashboard/bookings');
    }
  };

  const handleMessage = () => {
    if (!listing) return;
    const convo = startConversation(listing.providerId, listing, 'Hi! I am interested in your service.');
    if (convo) {
      navigate('/dashboard/messages');
    }
  };

  const isOwner = user?.id === listing?.providerId;

  const { receivedBookings } = useBookings();
  const listingBookings = useMemo(() => 
    receivedBookings.filter(b => b.listingId === listing?.id),
    [receivedBookings, listing?.id]
  );

  const stats = useMemo(() => {
    if (!listing) return null;
    return [
      { label: 'Total Bookings', value: listing.bookingCount || 0, icon: Calendar },
      { label: 'Total Revenue', value: formatPrice((listing.bookingCount || 0) * listing.price, listing.priceType), icon: DollarSign },
      { label: 'Rating', value: listing.rating.toFixed(1), icon: Star },
      { label: 'Reviews', value: listing.reviewCount, icon: MessageSquare },
    ];
  }, [listing]);

  if (isLoading || !listing) {
    return <div className="p-6 flex items-center justify-center min-h-[400px] text-muted-foreground">Loading service details...</div>;
  }

  const imageUrl = listing.images[0] || getCategoryImage(listing.category);
  const locationText = listing.location.neighborhood && listing.location.city
    ? `${listing.location.neighborhood}, ${listing.location.city}`
    : listing.location.city || listing.location.neighborhood || 'Location not specified';

  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 -ml-4 hover:bg-transparent hover:text-primary transition-colors">
        ← Back to listings
      </Button>

      {/* Featured Image Banner */}
      <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden bg-muted relative shadow-md">
        <img 
          src={imageUrl} 
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = getCategoryImage('Other');
          }}
        />
        <div className="absolute top-4 right-4">
          <Badge className="bg-background/90 text-foreground hover:bg-background backdrop-blur-sm text-sm px-3 py-1 shadow-sm">
            {listing.category}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 md:p-8 space-y-6 border-none shadow-md">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{listing.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{locationText}</span>
                </div>
                {listing.rating > 0 && (
                  <div className="flex items-center gap-1.5 bg-yellow-100/50 text-yellow-800 dark:text-yellow-500 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-medium">{listing.rating.toFixed(1)} ({listing.reviewCount} reviews)</span>
                  </div>
                )}
                {/* Provider info or other metadata could go here */}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-xl font-semibold">About this service</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-lg">
                {listing.description}
              </p>
            </div>
            
            {listing.tags && listing.tags.length > 0 && (
              <div className="space-y-3 pt-4">
                <h4 className="font-medium">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar / Booking Area */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 border-none shadow-md sticky top-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Service Price</p>
              <div className="text-3xl font-bold text-primary">
                {formatPrice(listing.price, listing.priceType)}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isOwner ? (
                <>
                  <Button size="lg" variant="hero" onClick={() => navigate('/dashboard/bookings')} className="w-full text-base font-semibold shadow-sm">
                    Manage Bookings
                  </Button>
                  <Button size="lg" variant="outline" className="w-full text-base font-semibold" onClick={() => navigate(`/dashboard/my-services/edit/${listing.id}`)}>
                    Edit Listing
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" variant="hero" onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth'})} className="w-full text-base font-semibold shadow-sm">
                    Book Now
                  </Button>
                  <Button size="lg" variant="outline" className="w-full text-base font-semibold" onClick={handleMessage}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Message Provider
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Conditional Bottom Section: Booking Form (Customer) or Service Performance (Owner) */}
      <div id="booking-section" className="pt-6">
        {isOwner ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats?.map((stat) => (
                <Card key={stat.label} className="p-4 border-none shadow-sm flex flex-col justify-center items-center text-center space-y-1">
                  <stat.icon className="h-5 w-5 text-primary mb-1" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                </Card>
              ))}
            </div>

            <Card className="p-6 md:p-8 space-y-6 border-none shadow-md">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" /> Service Activity
                  </h3>
                  <p className="text-muted-foreground">Recent bookings and updates for this specific service listing.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/bookings')}>View All Activity</Button>
              </div>

              <div className="space-y-4">
                {listingBookings.length > 0 ? (
                  listingBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{booking.seekerName || 'Anonymous Seeker'}</p>
                          <p className="text-xs text-muted-foreground">{booking.scheduledDate} at {booking.scheduledTime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={booking.status === 'confirmed' ? 'success' : booking.status === 'pending' ? 'warning' : 'secondary'} className="capitalize">
                          {booking.status}
                        </Badge>
                        <p className="text-xs font-bold mt-1 text-primary">{formatPrice(booking.totalPrice, 'fixed')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
                    <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-muted-foreground">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <p className="text-muted-foreground font-medium">No bookings yet for this service.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Once clients start booking, their activity will appear here.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6 md:p-8 space-y-6 border-none shadow-md">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" /> Request a Booking
              </h3>
              <p className="text-muted-foreground">Select your preferred date, time, and provide any necessary details.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={bookingData.date}
                  className="h-12"
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={bookingData.time}
                  className="h-12"
                  onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Minutes"
                    value={bookingData.duration}
                    className="h-12 pl-10"
                    onChange={(e) => setBookingData(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea
                placeholder="Tell the provider what you need help with..."
                className="min-h-[120px] resize-y"
                value={bookingData.notes}
                onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button size="lg" variant="hero" onClick={handleBooking} disabled={!canBook} className="px-8 text-base">
                Submit Request
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ListingDetailPage;

