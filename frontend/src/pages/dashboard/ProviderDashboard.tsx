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
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto space-y-8">
      {/* Header with CTA */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Provider Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your services and bookings in one place.</p>
        </div>
        <Button variant="hero" onClick={() => navigate('/dashboard/my-services/new')} className="shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Add Service
        </Button>
      </motion.div>

      {/* Stats Grid - Enhanced with better hierarchy and elevation */}
      <Skeleton name="provider-stats" loading={loading}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat) => (
            <Card 
              key={stat.label} 
              className="rounded-2xl border-border/40 bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground/80 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 bg-muted/60 text-muted-foreground border-none">
                    {stat.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                  <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </Skeleton>

      {/* Pending Bookings Section - Major improvement in structure and clarity */}
      <Skeleton name="provider-pending" loading={loading}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden bg-card/30">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">Pending Requests</h3>
                  <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary text-xs font-bold border-none px-2.5">
                    {bookingsByStatus.pending.length}
                  </Badge>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => navigate('/dashboard/bookings')}
                  className="text-primary font-semibold hover:no-underline hover:opacity-80 transition-opacity p-0 h-auto"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {bookingsByStatus.pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 border border-border/20">
                    <Calendar className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-lg font-bold text-foreground">No pending requests</p>
                  <p className="text-sm text-muted-foreground mt-1">You're all caught up 🎉</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {bookingsByStatus.pending.slice(0, 3).map((booking) => (
                    <div 
                      key={booking.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/40 bg-card/80 hover:bg-card hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">{booking.serviceTitle}</p>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight text-primary/70 border-primary/20 bg-primary/5">
                              Pending
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <p className="text-sm text-muted-foreground font-medium">{booking.seeker?.name || 'New Client'}</p>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30 hidden sm:block" />
                            <p className="text-sm text-muted-foreground">{booking.scheduledDate} at {booking.scheduledTime}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-border/40">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="flex-1 sm:flex-none text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors font-semibold"
                        >
                          Decline
                        </Button>
                        <Button 
                          size="sm" 
                          variant="success" 
                          className="flex-1 sm:flex-none shadow-md shadow-success/10 font-semibold"
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Skeleton>


    </div>
  );
};

export default ProviderDashboard;
