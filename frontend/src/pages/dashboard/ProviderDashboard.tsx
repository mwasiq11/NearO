import { motion } from 'framer-motion';
import { Plus, TrendingUp, Calendar, DollarSign, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useEarnings } from '@/hooks/useEarnings';
import { Skeleton } from 'boneyard-js/react';


const ProviderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookingsByStatus, upcomingBookings } = useBookings();
  const { providerData, loading, fetchProviderEarnings } = useEarnings();

  useEffect(() => {
    fetchProviderEarnings();
  }, [fetchProviderEarnings]);

  const stats = providerData ? [
    { 
      label: 'Total Earnings', 
      value: `$${providerData.stats.totalEarnings.toFixed(2)}`, 
      icon: DollarSign, 
      change: providerData.stats.pendingEarnings > 0 ? `+$${providerData.stats.pendingEarnings.toFixed(2)}` : '+$0'
    },
    { 
      label: 'Bookings', 
      value: providerData.stats.totalBookings.toString(), 
      icon: Calendar, 
      change: `+${providerData.stats.pendingBookings}` 
    },
    { 
      label: 'Rating', 
      value: user?.reputation?.overall?.toFixed(1) || '0', 
      icon: Star, 
      change: 'Gold' 
    },
    { 
      label: 'Clients', 
      value: providerData.stats.totalClients.toString(), 
      icon: Users, 
      change: `+${providerData.stats.completedBookings}` 
    },
  ] : [
    { label: 'Total Earnings', value: '$0', icon: DollarSign, change: '+$0' },
    { label: 'Bookings', value: '0', icon: Calendar, change: '+0' },
    { label: 'Rating', value: user?.reputation?.overall?.toFixed(1) || '0', icon: Star, change: 'Gold' },
    { label: 'Clients', value: '0', icon: Users, change: '+0' },
  ];

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <Button variant="hero" onClick={() => navigate('/dashboard/my-services/new')}>
          <Plus className="h-4 w-4 mr-2" /> Add Service
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <Skeleton name="provider-stats" loading={loading}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <Badge variant="success" className="text-2xs">{stat.change}</Badge>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </Skeleton>

      {/* Pending Bookings */}
      <Skeleton name="provider-pending" loading={loading}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pending Requests ({bookingsByStatus.pending.length})</span>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/bookings')}>View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsByStatus.pending.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending requests</p>
              ) : (
                <div className="space-y-3">
                  {bookingsByStatus.pending.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Booking Request</p>
                        <p className="text-sm text-muted-foreground">{booking.scheduledDate} at {booking.scheduledTime}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Decline</Button>
                        <Button size="sm" variant="success">Accept</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Skeleton>

      {/* Reputation Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">⭐</div>
              <div>
                <p className="text-sm text-primary-foreground/80">Your Reputation Score</p>
                <p className="text-3xl font-bold">{user?.reputation.overall.toFixed(1)}</p>
                <Badge variant="gold" className="mt-1">Gold Provider</Badge>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold">{user?.reputation.totalReviews}</p>
                <p className="text-sm text-primary-foreground/80">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProviderDashboard;
