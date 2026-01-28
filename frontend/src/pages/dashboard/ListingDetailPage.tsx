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
import { api } from '@/lib/api';
import { ServiceListing } from '@/models/types';
import { formatPrice } from '@/utils/formatters';
import { MapPin, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getListingById } = useListings();
  const { createBooking } = useBookings();
  const { startConversation } = useChat();
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

  if (isLoading || !listing) {
    return <div className="p-6 text-sm text-muted-foreground">Loading service...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        ← Back
      </Button>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{listing.title}</h2>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.location.neighborhood && listing.location.city
                ? `${listing.location.neighborhood}, ${listing.location.city}`
                : listing.location.city || listing.location.neighborhood || 'Location not specified'}
            </div>
          </div>
          <Badge variant="outline">{listing.category}</Badge>
        </div>
        <p className="text-muted-foreground">{listing.description}</p>
        <div className="text-xl font-semibold text-primary">
          {formatPrice(listing.price, listing.priceType)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1" onClick={handleMessage}>
            <MessageSquare className="h-4 w-4" /> Message provider
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Book this service</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            type="date"
            value={bookingData.date}
            onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
          />
          <Input
            type="time"
            value={bookingData.time}
            onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Duration (mins)"
            value={bookingData.duration}
            onChange={(e) => setBookingData(prev => ({ ...prev, duration: e.target.value }))}
          />
        </div>
        <Textarea
          placeholder="Notes for the provider"
          value={bookingData.notes}
          onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
        />
        <Button variant="hero" onClick={handleBooking} disabled={!canBook}>
          Request booking
        </Button>
      </Card>
    </div>
  );
};

export default ListingDetailPage;

