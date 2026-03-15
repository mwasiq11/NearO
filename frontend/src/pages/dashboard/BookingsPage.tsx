import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { formatDate } from '@/utils/formatters';
import { getCategoryImage } from '@/utils/categoryImages';
import { useAppSelector } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';

const BookingsPage = () => {
  const { myBookings, receivedBookings, isLoading, acceptBooking, rejectBooking } = useBookings();
  const { user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const [view, setView] = useState<'mine' | 'received'>('mine');
  const bookings = view === 'mine' ? myBookings : receivedBookings;

  const handleAccept = async (bookingId: string) => {
    await acceptBooking(bookingId);
  };

  const handleReject = async (bookingId: string) => {
    await rejectBooking(bookingId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const pendingReceivedCount = receivedBookings.filter(b => b.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bookings</h2>
          <p className="text-muted-foreground">Track upcoming and past requests.</p>
        </div>
        <div className="inline-flex rounded-full border bg-background p-1">
          <Button
            size="sm"
            variant={view === 'mine' ? 'hero' : 'ghost'}
            onClick={() => setView('mine')}
          >
            My bookings
          </Button>
          <Button
            size="sm"
            variant={view === 'received' ? 'hero' : 'ghost'}
            onClick={() => setView('received')}
            className="relative"
          >
            Received
            {pendingReceivedCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {pendingReceivedCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading bookings...</div>}

      <div className="grid gap-4">
        {bookings.map((booking) => {
          const imageUrl = booking.serviceImageUrl || getCategoryImage(booking.serviceCategory || 'Other');
          
          return (
            <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <div className="flex flex-col md:flex-row h-full">
                {/* Image Section */}
                <div 
                  className="w-full md:w-64 h-48 md:h-auto bg-muted flex-shrink-0 cursor-pointer relative"
                  onClick={() => booking.listingId && navigate(`/dashboard/listing/${booking.listingId}`)}
                >
                  <img 
                    src={imageUrl} 
                    alt={booking.serviceTitle || 'Service'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = getCategoryImage('Other');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden pointer-events-none" />
                  <div className="absolute bottom-3 left-3 md:hidden">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        {booking.serviceCategory && (
                          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                            {booking.serviceCategory}
                          </p>
                        )}
                        <h3 
                          className="text-lg font-bold cursor-pointer hover:text-primary transition-colors"
                          onClick={() => booking.listingId && navigate(`/dashboard/listing/${booking.listingId}`)}
                        >
                          {booking.serviceTitle || 'Service booking'}
                        </h3>
                        {view === 'received' && booking.seekerName && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Requested by: <span className="font-medium text-foreground">{booking.seekerName}</span>
                          </p>
                        )}
                      </div>
                      <div className="hidden md:block">
                        <Badge className={`${getStatusColor(booking.status)} px-3 py-1 shadow-sm`}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 mt-4 text-sm bg-muted/30 p-3 rounded-lg">
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <div className="font-medium">{formatDate(booking.scheduledDate)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <div className="font-medium">{booking.scheduledTime}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <div className="font-semibold text-primary">${booking.totalPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">{booking.duration} mins</div>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-4 text-sm">
                        <span className="font-medium text-foreground">Notes: </span>
                        <span className="text-muted-foreground">{booking.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {view === 'received' && 
                   booking.status === 'pending' && 
                   booking.providerId === user?.id && (
                    <div className="flex items-center gap-3 pt-4 border-t mt-auto">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                        onClick={() => handleAccept(booking.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept Request
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950 flex-1 md:flex-none"
                        onClick={() => handleReject(booking.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!isLoading && bookings.length === 0 && (
        <div className="text-sm text-muted-foreground">No bookings yet.</div>
      )}
    </div>
  );
};

export default BookingsPage;

