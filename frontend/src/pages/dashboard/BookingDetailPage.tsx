import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Package,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startConversation } = useChat();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await api.get<any>(`/bookings/${id}`, { auth: true });
        setBooking(data);
      } catch (error) {
        console.error('Failed to fetch booking:', error);
        toast.error('Could not load booking details');
        navigate('/dashboard/bookings');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id, navigate]);

  const handleContact = () => {
    if (!booking) return;
    const otherUserId = user?.id === booking.seeker_id ? booking.provider_id : booking.seeker_id;
    
    startConversation(otherUserId, {
      id: booking.service_id,
      title: booking.service_title,
      providerId: booking.provider_id
    } as any);
    
    navigate(`/dashboard/messages?conversationId=pending-${otherUserId}`);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          label: 'Confirmed',
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          message: 'This booking has been accepted by the provider.'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-5 w-5 text-destructive" />,
          label: 'Rejected',
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          message: 'Your booking request was rejected.'
        };
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          label: 'Pending',
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          message: 'Waiting for provider approval.'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-muted-foreground" />,
          label: status,
          color: 'bg-muted text-muted-foreground',
          message: ''
        };
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!booking) return null;

  const status = getStatusDisplay(booking.status);
  const isSeeker = user?.id === booking.seeker_id;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/dashboard/bookings')}
          className="rounded-full hover:bg-muted"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Booking Details</h1>
          <p className="text-muted-foreground text-sm font-medium">Reference: {id?.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-foreground/5 bg-card/50 backdrop-blur-sm overflow-hidden rounded-3xl">
            <div className="h-48 md:h-64 relative overflow-hidden">
              <img 
                src={booking.service_image_url || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200'} 
                alt={booking.service_title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="space-y-1">
                  <Badge className="bg-primary/20 backdrop-blur-md text-primary-foreground border-none px-3 py-1 mb-2">
                    {booking.category}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white">{booking.service_title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-xs font-medium uppercase tracking-widest">Total Price</p>
                  <p className="text-2xl font-black text-white">{booking.currency} {booking.total_price}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 md:p-8 space-y-8">
              {/* Status Section */}
              <div className={cn(
                "flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border",
                status.color
              )}>
                <div className="flex items-center gap-3">
                  {status.icon}
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider">{status.label}</p>
                    <p className="text-xs font-medium opacity-80">{status.message}</p>
                  </div>
                </div>
                {booking.status === 'pending' && isSeeker && (
                  <Badge variant="outline" className="animate-pulse bg-amber-500/5 border-amber-500/20 text-amber-600">
                    Awaiting Provider
                  </Badge>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Schedule
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <span className="text-sm font-medium text-muted-foreground">Requested Date</span>
                      <span className="text-sm font-bold">{new Date(booking.requested_time).toLocaleDateString('en-US', { dateStyle: 'full' })}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <span className="text-sm font-medium text-muted-foreground">Time Slot</span>
                      <span className="text-sm font-bold">{new Date(booking.requested_time).toLocaleTimeString('en-US', { timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" /> Service Details
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    "{booking.service_description || 'No additional description provided for this service.'}"
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-6 md:p-8 bg-muted/20 border-t flex flex-col md:flex-row gap-4 items-center justify-between">
               <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                 <ShieldCheck className="h-4 w-4 text-emerald-500" />
                 Secure payment protection enabled
               </div>
               <Button 
                onClick={() => navigate(`/dashboard/listing/${booking.service_id}`)}
                variant="outline" 
                className="rounded-xl font-bold gap-2"
               >
                 View Service Listing <ExternalLink className="h-4 w-4" />
               </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar - Participant Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-foreground/5 bg-card/50 backdrop-blur-sm rounded-3xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
              {isSeeker ? 'Service Provider' : 'Customer Info'}
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 border-2 border-primary/10">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${isSeeker ? 'Provider' : booking.seeker_name}`} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-black truncate">{isSeeker ? 'Verified Provider' : booking.seeker_name}</p>
                <p className="text-xs text-muted-foreground truncate">{isSeeker ? 'Top Rated' : booking.seeker_email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleContact}
                className="w-full rounded-2xl font-bold h-12 gap-2 shadow-lg shadow-primary/20"
              >
                <MessageSquare className="h-5 w-5" /> Send Message
              </Button>
              <Button variant="outline" className="w-full rounded-2xl font-bold h-12">
                View Profile
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-xl shadow-foreground/5 bg-primary/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60 mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Need Help?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              If you encounter any issues with this booking, please contact our 24/7 support team.
            </p>
            <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary">
              Contact Support
            </Button>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingDetailPage;
