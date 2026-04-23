import { motion } from 'framer-motion';
import { Search, MapPin, TrendingUp, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Rating } from '@/components/common/Rating';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { useBookings } from '@/hooks/useBookings';
import { Skeleton } from 'boneyard-js/react';
import { formatPrice, formatDate } from '@/utils/formatters';
import { getCategoryEmoji } from '@/utils/categoryEmojis';
import { getCategoryImage } from '@/utils/categoryImages';
import React from 'react';

const SeekerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listings, isLoading: listingsLoading } = useListings();
  const { myBookings, isLoading: bookingsLoading } = useBookings();

  const isLoading = listingsLoading || bookingsLoading;

  const categories = [
    { name: 'Cleaning', color: 'bg-blue-500' },
    { name: 'Repairs', color: 'bg-green-500' },
    { name: 'Delivery', color: 'bg-purple-500' },
    { name: 'Moving', color: 'bg-orange-500' },
    { name: 'Personal Care', color: 'bg-pink-500' },
    { name: 'Tech Support', color: 'bg-indigo-500' },
    { name: 'Gardening', color: 'bg-emerald-500' },
    { name: 'Other', color: 'bg-gray-500' },
  ];

  const upcomingBookings = myBookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const trendingListings = listings.slice(0, 8);

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
      {/* Hero Search Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="relative group w-full bg-background rounded-2xl border border-border shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <Input 
            placeholder="Search for services..." 
            className="pl-14 h-16 bg-transparent border-0 text-foreground placeholder:text-muted-foreground rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-lg font-medium w-full shadow-none"
            onClick={() => navigate('/dashboard/browse')}
            readOnly
          />
        </div>
      </motion.div>

      {/* Categories Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <Button variant="ghost" size="sm" className="font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => navigate('/dashboard/browse')}>
            Explore All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <Skeleton name="dashboard-categories" loading={isLoading}>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
            {categories.slice(0, 8).map((cat) => {
              const Icon = getCategoryEmoji(cat.name);
              return (
                <button 
                  key={cat.name}
                  onClick={() => navigate(`/dashboard/browse?category=${cat.name}`)}
                  className="group flex flex-col items-center p-4 rounded-2xl bg-card hover:bg-primary/5 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 shadow-sm"
                >
                  <div className="mb-3 p-3 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <span className="text-xs font-semibold text-center line-clamp-1">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </Skeleton>
      </motion.div>

      {/* Upcoming Bookings - Adaptive Carousel/List */}
      {upcomingBookings.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Upcoming Services</h2>
            <Button variant="link" size="sm" onClick={() => navigate('/dashboard/bookings')} className="font-bold text-primary p-0">View All</Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            {upcomingBookings.map((booking) => (
              <Card 
                key={booking.id} 
                className="flex-shrink-0 w-[280px] sm:w-[320px] p-4 rounded-2xl border-none shadow-lg bg-gradient-to-br from-card to-muted/30 hover:shadow-xl transition-all cursor-pointer group"
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
                  <div className="flex items-center gap-1.5 text-muted-foreground">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Trending Services</h2>
            {user?.neighborhood && <Badge variant="outline" className="font-semibold border-accent/20 text-accent">Near {user.neighborhood}</Badge>}
          </div>
        </div>
        
        <Skeleton name="trending-services" loading={isLoading}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingListings.slice(0, 4).map((listing, idx) => {
              const imageUrl = listing.images?.[0] || getCategoryImage(listing.category);
              return (
                <Card 
                  key={listing.id} 
                  className="group overflow-hidden rounded-2xl border-border/50 hover:border-primary/20 hover:shadow-2xl transition-all duration-500 bg-card cursor-pointer"
                  onClick={() => navigate(`/dashboard/listing/${listing.id}`)}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img 
                      src={imageUrl} 
                      alt={listing.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                       <Badge variant="secondary" className="shadow-lg backdrop-blur-md bg-white/80 dark:bg-black/80 font-bold">{listing.category}</Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                         <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">{listing.title}</h3>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground gap-1 font-medium">
                        <MapPin className="h-3 w-3" />
                        <span>{listing.location.neighborhood || listing.location.city}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
                       <div className="flex items-center gap-1.5">
                         <Rating value={listing.rating} size="sm" />
                         <span className="text-xs font-bold text-muted-foreground">({listing.reviewCount})</span>
                       </div>
                       <div className="font-bold text-lg text-primary">
                         {formatPrice(listing.price, listing.priceType, listing.currency)}
                       </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Skeleton>
      </motion.div>
    </div>
  );
};

export default SeekerDashboard;
