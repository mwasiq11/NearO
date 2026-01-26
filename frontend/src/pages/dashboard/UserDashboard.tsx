import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { apiCall } from '@/lib/api';
import { Briefcase, Users, MessageSquare, Star, Plus, Eye, TrendingUp } from 'lucide-react';

interface DashboardStats {
  servicesProvided: number;
  bookingsMade: number;
  reviewsReceived: number;
  avgRating: number;
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  created_at: string;
  is_active: boolean;
  booking_count: number;
  avg_rating: number;
}

interface Booking {
  booking_id: string;
  service_id: string;
  title: string;
  category: string;
  price: number;
  status: string;
  requested_time: string;
  created_at: string;
  provider_name: string;
  provider_email: string;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Load stats
      const statsResponse = await apiCall('/history/dashboard-stats', {
        method: 'GET',
        auth: true
      });

      if (statsResponse.ok) {
        setStats(statsResponse.data.stats);
      }

      // Load provided services
      const servicesResponse = await apiCall('/history/service?type=provider', {
        method: 'GET',
        auth: true
      });

      if (servicesResponse.ok) {
        setServices(servicesResponse.data.services);
      }

      // Load bookings made
      const bookingsResponse = await apiCall('/history/service?type=seeker', {
        method: 'GET',
        auth: true
      });

      if (bookingsResponse.ok) {
        setBookings(bookingsResponse.data.bookings);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
            <p className="text-gray-600 mt-1">Manage your services and bookings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/history')}>
              View History
            </Button>
            <Button onClick={() => logout()}>Logout</Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Services Provided
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.servicesProvided}</div>
                <p className="text-xs text-gray-500 mt-1">Active services</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Bookings Made
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.bookingsMade}</div>
                <p className="text-xs text-gray-500 mt-1">Total bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.reviewsReceived}</div>
                <p className="text-xs text-gray-500 mt-1">Received as provider</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</div>
                <p className="text-xs text-gray-500 mt-1">Average rating</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with your next action</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => navigate('/create-service')} className="w-full" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Post a Service
                </Button>
                <Button onClick={() => navigate('/dashboard/browse')} variant="outline" className="w-full" size="lg">
                  <Eye className="w-4 h-4 mr-2" />
                  Browse Services
                </Button>
                <Button onClick={() => navigate('/profile')} variant="outline" className="w-full" size="lg">
                  <Users className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button onClick={() => navigate('/messages')} variant="outline" className="w-full" size="lg">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Services You Provide</h2>
              <Button onClick={() => navigate('/create-service')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>

            {services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium">No services yet</h3>
                  <p className="text-gray-600 mt-1">Start by creating your first service</p>
                  <Button onClick={() => navigate('/create-service')} className="mt-4">
                    Create Service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => (
                  <Card key={service.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{service.title}</CardTitle>
                          <Badge className="mt-2">{service.category}</Badge>
                        </div>
                        <Badge variant={service.is_active ? 'default' : 'secondary'}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-2xl font-bold">${service.price}</p>
                          <p className="text-xs text-gray-500">per service</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{service.avg_rating.toFixed(1)}</p>
                          <p className="text-xs text-gray-500">{service.booking_count} bookings</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4 mt-6">
            <h2 className="text-xl font-bold">Services You've Booked</h2>

            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium">No bookings yet</h3>
                  <p className="text-gray-600 mt-1">Browse and book services in your area</p>
                  <Button onClick={() => navigate('/dashboard/browse')} className="mt-4">
                    Browse Services
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <Card key={booking.booking_id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Service</p>
                          <p className="font-semibold">{booking.title}</p>
                          <p className="text-xs text-gray-500">{booking.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Provider</p>
                          <p className="font-semibold">{booking.provider_name}</p>
                          <p className="text-xs text-gray-500">{booking.provider_email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className="mt-1">
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Price</p>
                          <p className="text-2xl font-bold">${booking.price}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
