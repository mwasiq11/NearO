import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Calendar, Package, ArrowUpRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEarnings } from '@/hooks/useEarnings';
import Loading from '@/components/common/Loading';
import { formatDistanceToNow } from 'date-fns';

const EarningsPage = () => {
  const { user } = useAuth();
  const { providerData, seekerData, loading, fetchProviderEarnings, fetchSeekerSpending } = useEarnings();
  
  const isProvider = user?.role === 'provider' || user?.role === 'user';

  useEffect(() => {
    if (isProvider) {
      fetchProviderEarnings();
    } else {
      fetchSeekerSpending();
    }
  }, [isProvider, fetchProviderEarnings, fetchSeekerSpending]);

  if (loading && !providerData && !seekerData) {
    return <Loading />;
  }

  // Provider view
  if (isProvider && providerData) {
    return (
      <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Earnings Dashboard</h1>
          <p className="text-muted-foreground">Track your income from services</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <Badge variant="success" className="text-2xs">
                  Total
                </Badge>
              </div>
              <p className="text-2xl font-bold">${providerData.stats.totalEarnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <Badge variant="warning" className="text-2xs">
                  Pending
                </Badge>
              </div>
              <p className="text-2xl font-bold">${providerData.stats.pendingEarnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Pending Earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <Badge variant="default" className="text-2xs">
                  {providerData.stats.completedBookings}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{providerData.stats.totalBookings}</p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <Badge variant="success" className="text-2xs">
                  Clients
                </Badge>
              </div>
              <p className="text-2xl font-bold">{providerData.stats.totalClients}</p>
              <p className="text-sm text-muted-foreground">Unique Clients</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Trend Chart */}
        {providerData.monthlyTrend.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providerData.monthlyTrend.map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{month.monthLabel}</p>
                        <p className="text-sm text-muted-foreground">{month.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${month.earnings?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Earnings by Service */}
        {providerData.earningsByService.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Earnings by Service</span>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providerData.earningsByService.map((service) => (
                    <div key={service.id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{service.title}</p>
                          <p className="text-sm text-muted-foreground">{service.category}</p>
                        </div>
                        <Badge variant="default">${service.price.toFixed(2)}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {service.completedCount} completed / {service.bookingCount} total bookings
                        </span>
                        <span className="font-bold text-primary">
                          ${service.totalEarned.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Transactions */}
        {providerData.recentBookings.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Completed Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {providerData.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{booking.serviceTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.seekerName} • {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">+${booking.price.toFixed(2)}</p>
                        <Badge variant="success" className="text-2xs">Completed</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {providerData.stats.totalBookings === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No earnings yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start accepting bookings to see your earnings here
                </p>
                <Button variant="hero">View Pending Bookings</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    );
  }

  // Seeker view
  if (!isProvider && seekerData) {
    return (
      <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Spending Dashboard</h1>
          <p className="text-muted-foreground">Track your service expenses</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <Badge variant="default" className="text-2xs">
                  Total
                </Badge>
              </div>
              <p className="text-2xl font-bold">${seekerData.stats.totalSpent.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <Badge variant="warning" className="text-2xs">
                  Pending
                </Badge>
              </div>
              <p className="text-2xl font-bold">${seekerData.stats.pendingAmount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <Badge variant="default" className="text-2xs">
                  {seekerData.stats.completedBookings}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{seekerData.stats.totalBookings}</p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <Badge variant="success" className="text-2xs">
                  Providers
                </Badge>
              </div>
              <p className="text-2xl font-bold">{seekerData.stats.totalProviders}</p>
              <p className="text-sm text-muted-foreground">Service Providers</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Trend Chart */}
        {seekerData.monthlyTrend.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {seekerData.monthlyTrend.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{month.monthLabel}</p>
                        <p className="text-sm text-muted-foreground">{month.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${month.spending?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Spending by Category */}
        {seekerData.spendingByCategory.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {seekerData.spendingByCategory.map((cat) => (
                    <div key={cat.category} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{cat.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {cat.completedCount} completed / {cat.bookingCount} total bookings
                          </p>
                        </div>
                        <span className="font-bold text-primary">
                          ${cat.totalSpent.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Transactions */}
        {seekerData.recentBookings.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Completed Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {seekerData.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{booking.serviceTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.providerName} • {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-destructive">-${booking.price.toFixed(2)}</p>
                        <Badge variant="success" className="text-2xs">Completed</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {seekerData.stats.totalBookings === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start booking services to track your spending here
                </p>
                <Button variant="hero">Browse Services</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
};

export default EarningsPage;
