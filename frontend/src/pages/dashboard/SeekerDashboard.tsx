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
    <div className="p-4 md:p-6 lg:p-8 pb-32 md:pb-8 max-w-7xl mx-auto space-y-12">
      {/* Search Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-8 flex flex-col items-center text-center max-w-2xl mx-auto"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
            Find <span className="text-primary italic">Expert</span> Services
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-medium">
            Reliable professionals in {user?.city || user?.neighborhood || 'your area'}
          </p>
        </div>

        <div className="relative group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="What service do you need today?"
            className="pl-14 h-16 text-lg rounded-3xl shadow-lg border-muted-foreground/10 focus-visible:ring-primary/20 bg-background/50 backdrop-blur-xl transition-all hover:bg-background hover:shadow-xl"
            onClick={() => navigate('/dashboard/browse')}
            readOnly
          />
        </div>
      </motion.div>

      {/* Categories Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Categories</h2>
          <Button variant="link" size="sm" className="text-primary font-bold h-auto p-0" onClick={() => navigate('/dashboard/browse')}>
            Explore All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
          {categories.slice(0, 8).map((cat) => {
            const Icon = getCategoryEmoji(cat.name);
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/dashboard/browse?category=${cat.id}`)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all group active:scale-95"
              >
                <div className="mb-3 p-3 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <span className="text-xs font-bold text-center line-clamp-1">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Upcoming Bookings - Adaptive Carousel/List */}
      {upcomingBookings.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Up Next</h2>
            <Button variant="ghost" size="sm" className="font-bold" onClick={() => navigate('/dashboard/bookings')}>
              Manage
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.slice(0, 2).map((booking) => (
              <Card key={booking.id} className="p-4 md:p-5 border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-all group cursor-pointer" onClick={() => navigate('/dashboard/bookings')}>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    {getCategoryEmoji(booking.category || '') ? 
                      React.createElement(getCategoryEmoji(booking.category || ''), { className: "w-7 h-7 text-primary" }) : 
                      '📅'
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm md:text-base truncate group-hover:text-primary transition-colors">
                      {booking.serviceTitle || 'Service Appointment'}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">
                      {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                    </p>
                  </div>
                  <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'} className="capitalize font-bold shadow-none">
                    {booking.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trending Services Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Trending <span className="text-accent underline decoration-2 underline-offset-4 decoration-accent/20">Now</span>
          </h2>
          {user?.neighborhood && <Badge variant="outline" className="font-bold border-accent/20 text-accent">Near {user.neighborhood}</Badge>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingListings.slice(0, 4).map((listing, idx) => {
            const imageUrl = listing.images?.[0] || getCategoryImage(listing.category);
            return (
              <Card 
                key={listing.id} 
                className="overflow-hidden border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group flex flex-col h-full bg-card/30 backdrop-blur-sm cursor-pointer" 
                onClick={() => navigate(`/dashboard/listing/${listing.id}`)}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img 
                    src={imageUrl} 
                    alt={listing.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading={idx < 2 ? 'eager' : 'lazy'}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getCategoryImage(listing.category);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {listing.isTrending && (
                    <Badge variant="trending" className="absolute top-3 left-3 font-black shadow-lg">🔥 HOT</Badge>
                  )}
                  
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                    <Rating value={listing.rating} reviewCount={listing.reviewCount} size="xs" variant="bright" />
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <MapPin className="h-3 w-3 text-primary/60" /> {listing.location.neighborhood}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Starting at</span>
                      <span className="font-black text-lg text-primary">{formatPrice(listing.price, listing.priceType, listing.currency)}</span>
                    </div>
                    <Button size="sm" variant="hero" className="rounded-xl font-bold h-9 px-4">Book</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default SeekerDashboard;
