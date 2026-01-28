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
import { formatPrice, formatDate } from '@/utils/formatters';
import { getCategoryEmoji } from '@/utils/categoryEmojis';
import { getCategoryImage } from '@/utils/categoryImages';

const SeekerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trendingListings, categories } = useListings();
  const { upcomingBookings } = useBookings();

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
      {/* Welcome & Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Hi, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-muted-foreground">What do you need help with today?</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for services..."
            className="pl-12 h-12 text-base rounded-xl"
            onClick={() => navigate('/dashboard/browse')}
            readOnly
          />
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Categories</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/browse')}>
            See all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/dashboard/browse?category=${cat.id}`)}
              className="flex flex-col items-center p-3 rounded-xl bg-card border hover:shadow-md transition-all"
            >
              <span className="text-2xl mb-1">{getCategoryEmoji(cat.name)}</span>
              <span className="text-xs text-center line-clamp-1">{cat.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Bookings</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/bookings')}>
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingBookings.slice(0, 2).map((booking) => (
              <Card key={booking.id} className="p-4 cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary-light flex items-center justify-center text-2xl">
                    🔧
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Service Booking</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                    </p>
                  </div>
                  <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>
                    {booking.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trending Services */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Trending {user?.neighborhood && user.neighborhood !== 'Unknown' ? `in ${user.neighborhood}` : 'Services'}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {trendingListings.slice(0, 4).map((listing) => {
            const imageUrl = listing.images?.[0] || getCategoryImage(listing.category);
            return (
            <Card key={listing.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/dashboard/listing/${listing.id}`)}>
              <div className="aspect-video bg-muted relative">
                <img 
                  src={imageUrl} 
                  alt={listing.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getCategoryImage(listing.category);
                  }}
                />
                {listing.isTrending && (
                  <Badge variant="trending" className="absolute top-2 left-2">🔥 Trending</Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-1 line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3" /> {listing.location.neighborhood}
                </p>
                <div className="flex items-center justify-between">
                  <Rating value={listing.rating} reviewCount={listing.reviewCount} size="sm" />
                  <span className="font-semibold text-primary">{formatPrice(listing.price, listing.priceType)}</span>
                </div>
              </div>
            </Card>
          );})}
        </div>
      </motion.div>
    </div>
  );
};

export default SeekerDashboard;
