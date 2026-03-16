import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Calendar, Package, ArrowUpRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEarnings } from '@/hooks/useEarnings';
import { formatDistanceToNow } from 'date-fns';
import { EarningsSkeleton } from './EarningsSkeleton';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Link } from 'react-router-dom';

const EarningsPage = () => {
  const { user } = useAuth();
  const { providerData, seekerData, loading, fetchProviderEarnings, fetchSeekerSpending } = useEarnings();
  
  const isProvider = (user?.role as any) === 'provider' || user?.role === 'user';

  useEffect(() => {
    if (isProvider) {
      fetchProviderEarnings();
    } else {
      fetchSeekerSpending();
    }
  }, [isProvider, fetchProviderEarnings, fetchSeekerSpending]);

  if (loading && !providerData && !seekerData) {
    return <EarningsSkeleton />;
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
          <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <Badge variant="success" className="bg-green-100 text-green-800 border-transparent dark:bg-green-900/30 dark:text-green-400">Total</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">${providerData.stats.totalEarnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Total Earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-500/20 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <Badge variant="warning" className="bg-orange-100 text-orange-800 border-transparent dark:bg-orange-900/30 dark:text-orange-400">Pending</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">${providerData.stats.pendingEarnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Pending Earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="default" className="bg-blue-100 text-blue-800 border-transparent dark:bg-blue-900/30 dark:text-blue-400">{providerData.stats.completedBookings} Done</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">{providerData.stats.totalBookings}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Total Bookings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <Badge variant="success" className="bg-purple-100 text-purple-800 border-transparent dark:bg-purple-900/30 dark:text-purple-400">Clients</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">{providerData.stats.totalClients}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Unique Clients</p>
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
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Monthly Earnings Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer
                  config={{
                    earnings: {
                      label: "Earnings",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={providerData.monthlyTrend} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="earnings" 
                        fill="var(--color-earnings)" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
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
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span>Earnings by Service</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {providerData.earningsByService.map((service) => {
                    const maxServiceEarning = Math.max(...providerData.earningsByService.map(s => s.totalEarned));
                    const percentage = maxServiceEarning > 0 ? (service.totalEarned / maxServiceEarning) * 100 : 0;
                    
                    return (
                      <Link to={`/dashboard/listing/${service.id}`} key={service.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-gradient-to-r from-muted/30 to-transparent hover:from-primary/5 transition-all border border-border/40 hover:border-primary/20 group shadow-sm">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex flex-col items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h4 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">{service.title}</h4>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{service.category}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">${service.totalEarned.toFixed(2)}</span>
                              <p className="text-xs text-muted-foreground font-medium">Total Earned</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                              <span className="text-muted-foreground">Completion Progress</span>
                              <span className="text-primary tracking-wide">{service.completedCount} of {service.bookingCount} bookings</span>
                            </div>
                            <div className="w-full bg-muted/80 rounded-full h-2 overflow-hidden border border-border/50">
                              <div className="bg-gradient-to-r from-primary/80 to-primary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
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
          <Card className="bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-rose-500/20 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-transparent dark:bg-rose-900/30 dark:text-rose-400">Total Spent</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">${seekerData.stats.totalSpent.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">All-time Spending</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-amber-500/20 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <Badge variant="warning" className="bg-amber-100 text-amber-800 border-transparent dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">${seekerData.stats.pendingAmount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Pending Approvals</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-500/20 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <Badge variant="default" className="bg-indigo-100 text-indigo-800 border-transparent dark:bg-indigo-900/30 dark:text-indigo-400">{seekerData.stats.completedBookings} Done</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">{seekerData.stats.totalBookings}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Total Bookings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-cyan-500/20 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <Badge variant="outline" className="bg-cyan-100 border-cyan-200 text-cyan-800 border-transparent dark:bg-cyan-900/30 dark:text-cyan-400">Providers</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">{seekerData.stats.totalProviders}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Hired Professionals</p>
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
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Monthly Spending Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer
                  config={{
                    spending: {
                      label: "Spending",
                      color: "hsl(var(--destructive))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seekerData.monthlyTrend} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="spending" 
                        fill="var(--color-spending)" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
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
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span>Spending by Category</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {seekerData.spendingByCategory.map((cat) => {
                    const maxCategorySpending = Math.max(...seekerData.spendingByCategory.map(c => c.totalSpent));
                    const percentage = maxCategorySpending > 0 ? (cat.totalSpent / maxCategorySpending) * 100 : 0;
                    
                    return (
                      <Link to={`/dashboard/browse?category=${cat.category.toLowerCase()}`} key={cat.category} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-gradient-to-r from-muted/30 to-transparent hover:from-rose-500/5 transition-all border border-border/40 hover:border-rose-500/20 group shadow-sm">
                        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex flex-col items-center justify-center shrink-0 group-hover:bg-rose-500/20 transition-colors">
                          <Package className="h-6 w-6 text-rose-500" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h4 className="font-semibold text-foreground text-lg group-hover:text-rose-500 transition-colors uppercase tracking-wider">{cat.category}</h4>
                              <p className="text-xs text-muted-foreground font-semibold uppercase">Category Spending</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-xl text-foreground group-hover:text-rose-500 transition-colors">${cat.totalSpent.toFixed(2)}</span>
                              <p className="text-xs text-muted-foreground font-medium">Total Spent</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                              <span className="text-muted-foreground">Booking Usage</span>
                              <span className="text-rose-500 tracking-wide">{cat.completedCount} of {cat.bookingCount} bookings</span>
                            </div>
                            <div className="w-full bg-muted/80 rounded-full h-2 overflow-hidden border border-border/50">
                              <div className="bg-gradient-to-r from-rose-500/80 to-rose-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
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
