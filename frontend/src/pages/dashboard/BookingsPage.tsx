import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { formatDate } from '@/utils/formatters';
import { useAppSelector } from '@/store/hooks';

const BookingsPage = () => {
  const { myBookings, receivedBookings, isLoading, acceptBooking, rejectBooking } = useBookings();
  const { user } = useAppSelector(state => state.auth);
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
        {bookings.map((booking) => (
          <Card key={booking.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold">Service booking</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: ${booking.totalPrice.toFixed(2)}
                </p>
                {booking.notes && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{booking.notes}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.replace('_', ' ')}
                </Badge>
                
                {/* Show accept/reject buttons for provider on pending received bookings */}
                {view === 'received' && 
                 booking.status === 'pending' && 
                 booking.providerId === user?.id && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={() => handleAccept(booking.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleReject(booking.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!isLoading && bookings.length === 0 && (
        <div className="text-sm text-muted-foreground">No bookings yet.</div>
      )}
    </div>
  );
};

export default BookingsPage;

