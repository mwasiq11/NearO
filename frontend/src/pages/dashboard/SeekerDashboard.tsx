import { motion } from 'framer-motion';
import { Search, MapPin, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import ServiceCard from '@/components/dashboard/ServiceCard';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { useBookings } from '@/hooks/useBookings';
import { Skeleton } from 'boneyard-js/react';
import { formatDate } from '@/utils/formatters';
import React from 'react';

const SeekerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listings, isLoading: listingsLoading } = useListings();
  const { myBookings, isLoading: bookingsLoading } = useBookings();

  const isLoading = listingsLoading || bookingsLoading;

  const upcomingBookings = myBookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const trendingListings = listings.slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:space-y-8 md:p-8">
      {/* Hero Search Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="relative group w-full rounded-2xl border border-border/70 bg-background shadow-[inset_0_1px_0_hsl(var(--foreground)/0.03)] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 ease-in-out">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <Input 
            placeholder="Search for services..." 
            className="h-12 w-full rounded-2xl border-0 bg-transparent pl-12 pr-4 text-sm md:text-base font-medium text-foreground placeholder:text-muted-foreground/90 shadow-none transition-all duration-200 ease-in-out focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={() => navigate('/dashboard/browse')}
            readOnly
          />
        </div>
      </motion.div>

      {/* Upcoming Bookings - Adaptive Carousel/List */}
      {upcomingBookings.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <SectionHeader
            title="Upcoming Services"
            rightContent={
              <Button variant="link" size="sm" onClick={() => navigate('/dashboard/bookings')} className="h-8 p-0 text-sm font-semibold text-primary">
                View All
              </Button>
            }
          />
          <div className="-mx-6 flex gap-5 overflow-x-auto px-6 pb-4 no-scrollbar md:-mx-8 md:px-8">
            {upcomingBookings.map((booking) => (
              <Card 
                key={booking.id} 
                className="group w-[280px] flex-shrink-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                onClick={() => navigate(`/dashboard/bookings`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{booking.serviceTitle}</h4>
                    <p className="text-xs text-muted-foreground">{booking.provider?.name}</p>
                  </div>
                  <Badge variant="default" className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary border-none">{booking.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-1.5 text-muted-foreground/90">
                    <MapPin className="h-3 w-3" />
                    <span>{booking.scheduledTime}</span>
                  </div>
                  <div className="px-2 py-1 bg-primary/5 rounded-lg text-primary">
                    {formatDate(booking.scheduledDate)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trending Services */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <SectionHeader
          title="Trending Services"
          rightContent={
            user?.neighborhood ? (
              <Badge variant="outline" className="h-7 rounded-full border-primary/20 bg-primary/5 px-3 text-[11px] font-medium text-primary">
                Near {user.neighborhood}
              </Badge>
            ) : null
          }
        />
        
        <Skeleton name="trending-services" loading={isLoading}>
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 md:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="flex h-full overflow-hidden rounded-2xl border border-border/60 bg-card p-0 shadow-sm">
                  <div className="aspect-[4/3] animate-pulse bg-muted" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-full animate-pulse rounded bg-muted" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 md:gap-6">
              {trendingListings.slice(0, 4).map((listing) => (
                <ServiceCard
                  key={listing.id}
                  listing={listing}
                  onClick={(listingId) => navigate(`/dashboard/listing/${listingId}`)}
                />
              ))}
            </div>
          )}
        </Skeleton>
      </motion.div>
    </div>
  );
};

export default SeekerDashboard;
