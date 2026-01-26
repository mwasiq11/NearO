import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBookings } from '@/hooks/useBookings';
import { formatDate } from '@/utils/formatters';

const BookingsPage = () => {
  const { myBookings, receivedBookings, isLoading } = useBookings();
  const [view, setView] = useState<'mine' | 'received'>('mine');
  const bookings = view === 'mine' ? myBookings : receivedBookings;

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
          >
            Received
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading bookings...</div>}

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Service booking</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
              </p>
              {booking.notes && (
                <p className="text-sm text-muted-foreground line-clamp-1">{booking.notes}</p>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {booking.status.replace('_', ' ')}
            </Badge>
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

