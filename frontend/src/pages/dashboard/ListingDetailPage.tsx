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
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { ServiceListing } from '@/models/types';
import { formatPrice, formatDate } from '@/utils/formatters';
import { getCategoryImage } from '@/utils/categoryImages';
import { MapPin, MessageSquare, Star, Clock, Calendar, DollarSign, TrendingUp, Users, ChevronLeft, Share2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import React from 'react';
import { Skeleton } from 'boneyard-js/react';

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getListingById } = useListings();
  const { createBooking } = useBookings();
  const { startConversation } = useChat();
  const { user } = useAuth();
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
          currency: service.currency || 'PKR',
          priceType: 'fixed',
          images: service.image_url ? [service.image_url] : (service.images || []),
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
      { label: 'Total Revenue', value: formatPrice((listing.bookingCount || 0) * listing.price, listing.priceType, listing.currency), icon: DollarSign },
      { label: 'Rating', value: listing.rating.toFixed(1), icon: Star },
      { label: 'Reviews', value: listing.reviewCount, icon: MessageSquare },
    ];
  }, [listing]);


  const imageUrl = listing?.images[0] || getCategoryImage(listing?.category || 'Other');
  const locationText = listing?.location.neighborhood && listing?.location.city
    ? `${listing.location.neighborhood}, ${listing.location.city}`
    : listing?.location.city || listing?.location.neighborhood || 'Location not specified';

  if (!id) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center space-y-4">
          <p className="text-muted-foreground font-medium">Invalid service link.</p>
          <Button onClick={() => navigate('/dashboard/browse')} variant="outline" className="font-semibold">
            Back to Services
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading && !listing) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-10 w-1/3 rounded bg-muted animate-pulse" />
        <div className="h-72 w-full rounded-2xl bg-muted animate-pulse" />
        <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!isLoading && !listing) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center space-y-4">
          <p className="text-muted-foreground font-medium">Service not found or unavailable.</p>
          <Button onClick={() => navigate('/dashboard/browse')} variant="outline" className="font-semibold">
            Back to Services
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <Skeleton name="listing-detail" loading={isLoading}>
      <div className="flex flex-col min-h-full bg-background pb-32 md:pb-12">
      {/* Mobile Top Navigation Override */}
      <div className="sticky top-0 z-40 md:hidden bg-background/80 backdrop-blur-md border-b px-4 h-14 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <span className="font-semibold text-xs uppercase tracking-widest text-center truncate px-4">Service Details</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto p-0 md:p-6 lg:p-8 space-y-6 md:space-y-10">
        {/* Breadcrumbs - Desktop Only */}
        <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate('/dashboard/browse')} className="hover:text-primary transition-colors">Services</button>
          <span>/</span>
          <span className="text-foreground">{listing.title}</span>
        </div>

        {/* Featured Content Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
          <div className="lg:col-span-12 space-y-6 md:space-y-8">
            {/* Aspect optimized for mobile focus */}
            <div className="w-full aspect-square md:aspect-[21/9] lg:aspect-[24/10] sm:rounded-3xl overflow-hidden bg-muted relative shadow-2xl group">
              <img 
                src={imageUrl} 
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = getCategoryImage('Other');
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent hidden md:block" />
              <div className="absolute top-4 left-4 md:top-8 md:left-8">
                <Badge className="bg-primary text-primary-foreground font-bold text-[10px] md:text-sm uppercase tracking-widest px-4 py-1.5 shadow-xl border-none">
                  {listing.category}
                </Badge>
              </div>
            </div>
            
            <div className="px-4 md:px-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-none">{listing.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-muted/50 px-4 py-2 rounded-2xl border border-border/50">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-xs md:text-sm">{locationText}</span>
                  </div>
                  {listing.rating > 0 && (
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-4 py-2 rounded-2xl border border-primary/20">
                      <Star className="h-4 w-4 fill-primary" />
                      <span className="font-semibold text-xs md:text-sm">{listing.rating.toFixed(1)} <span className="font-semibold opacity-60 ml-1">({listing.reviewCount} Reviews)</span></span>
                    </div>
                  )}
                  {listing.isTrending && (
                    <Badge variant="trending" className="font-bold text-[10px] px-3">🔥 Trending</Badge>
                  )}
                </div>
              </div>

              {/* Desktop Desktop Actions */}
              <div className="hidden md:flex flex-col items-end gap-2 bg-card border p-6 rounded-3xl shadow-xl shadow-primary/5 min-w-[280px]">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Investment</p>
                <div className="text-4xl font-semibold text-primary mb-4 tracking-tighter">
                  {formatPrice(listing.price, listing.priceType, listing.currency)}
                </div>
                <div className="w-full space-y-3">
                  {isOwner ? (
                    <Button size="lg" variant="hero" onClick={() => navigate('/dashboard/bookings')} className="w-full font-semibold text-base rounded-2xl shadow-lg shadow-primary/20">
                      Manage Bookings
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      variant="hero" 
                      onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth'})} 
                      className="w-full font-semibold text-base rounded-2xl shadow-lg shadow-primary/20"
                    >
                      Book Appointment
                    </Button>
                  )}
                  {!isOwner && (
                    <Button size="lg" variant="outline" className="w-full font-semibold text-base rounded-2xl" onClick={handleMessage}>
                      <MessageSquare className="h-5 w-5 mr-2" /> Message
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-12 gap-10 px-4 md:px-0">
          <div className="lg:col-span-8 space-y-10">
            {/* Description Section */}
            <section className="space-y-4">
              <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
                <span className="h-1 w-8 bg-primary rounded-full hidden md:block" />
                Service Overview
              </h3>
              <p className="text-muted-foreground font-medium leading-relaxed whitespace-pre-line text-lg">
                {listing.description}
              </p>
              
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {listing.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="font-semibold text-[10px] uppercase rounded-lg border-muted-foreground/10 px-3 py-1">#{tag}</Badge>
                  ))}
                </div>
              )}
            </section>

            {/* Sub-content Area */}
            <div id="booking-section" className="pt-4 scroll-mt-24">
              {isOwner ? (
                <section className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats?.map((stat) => (
                      <Card key={stat.label} className="p-6 border-none bg-muted/30 flex flex-col justify-center items-center text-center space-y-2 rounded-3xl group hover:bg-card hover:shadow-xl transition-all">
                        <stat.icon className="h-5 w-5 text-primary mb-1 group-hover:scale-125 transition-transform" />
                        <p className="text-xl font-semibold tracking-tight">{stat.value}</p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">{stat.label}</p>
                      </Card>
                    ))}
                  </div>

                  <Card className="p-6 md:p-10 space-y-8 border-none bg-card shadow-2xl shadow-primary/5 rounded-[40px]">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-semibold flex items-center gap-3 tracking-tight">
                          <TrendingUp className="h-6 w-6 text-primary" /> Performance
                        </h3>
                        <p className="text-muted-foreground font-medium text-sm">Real-time engagement tracking.</p>
                      </div>
                      <Button variant="outline" size="sm" className="font-semibold rounded-xl" onClick={() => navigate('/dashboard/bookings')}>View Analytics</Button>
                    </div>

                    <div className="space-y-4">
                      {listingBookings.length > 0 ? (
                        listingBookings.slice(0, 5).map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-5 rounded-[28px] bg-muted/20 border border-border/40 group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                <Users className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm md:text-base">{booking.seekerName || 'Demo User'}</p>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase">{formatDate(booking.scheduledDate)} · {booking.scheduledTime}</p>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <Badge variant={booking.status === 'confirmed' ? 'success' : booking.status === 'pending' ? 'warning' : 'secondary'} className="font-semibold text-[9px] uppercase tracking-tighter rounded-lg h-5">
                                {booking.status}
                              </Badge>
                              <p className="text-sm font-semibold text-primary">{formatPrice(booking.totalPrice, 'fixed', listing.currency)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16 bg-muted/10 rounded-[32px] border-2 border-dashed border-border/60">
                          <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-muted-foreground">
                            <Calendar className="h-8 w-8" />
                          </div>
                          <p className="text-muted-foreground font-semibold text-lg tracking-tight">Zero Bookings Yet</p>
                          <p className="text-sm text-muted-foreground/60 font-medium mt-2 max-w-xs mx-auto">Promote your service to start receiving appointments from the community.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </section>
              ) : (
                <Card className="p-6 md:p-10 space-y-8 border-none bg-card shadow-2xl shadow-primary/5 rounded-[40px]">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold flex items-center gap-3 tracking-tighter">
                      <Calendar className="h-7 w-7 text-primary" /> Instant Booking
                    </h3>
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed max-w-md">Secure your spot by selecting a convenient window below. The provider will be notified immediately.</p>
                  </div>
                  
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">Preferred Date</label>
                      <Input
                        type="date"
                        value={bookingData.date}
                        className="h-12 md:h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 font-medium"
                        onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">Arrival Time</label>
                      <Input
                        type="time"
                        value={bookingData.time}
                        className="h-12 md:h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 font-medium"
                        onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">Duration (Min)</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="60"
                          value={bookingData.duration}
                          className="h-12 md:h-14 pl-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 font-medium"
                          onChange={(e) => setBookingData(prev => ({ ...prev, duration: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">Job Details & Notes</label>
                    <Textarea
                      placeholder="Help the provider prepare by describing your requirements..."
                      className="min-h-[140px] rounded-[24px] bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 font-medium p-4 resize-none"
                      value={bookingData.notes}
                      onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      size="lg" 
                      variant="hero" 
                      onClick={handleBooking} 
                      disabled={!canBook} 
                      className="w-full sm:w-auto px-12 h-14 rounded-2xl font-semibold text-lg shadow-xl shadow-primary/20 transition-transform active:scale-95"
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t p-4 flex items-center justify-between shadow-[0_-8px_40px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Total Price</p>
          <div className="text-xl font-semibold text-primary tracking-tighter">
            {formatPrice(listing.price, listing.priceType, listing.currency)}
          </div>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" className="h-12 w-12 rounded-2xl border-2" onClick={handleMessage}>
              <MessageSquare className="h-6 w-6" />
            </Button>
            <Button 
              size="lg" 
              variant="hero" 
              onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth'})} 
              className="px-8 h-12 rounded-2xl font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              Book Now
            </Button>
          </div>
        </div>
      )}
      </div>
    </Skeleton>
  );
};

export default ListingDetailPage;
;

