import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addBooking,
  updateBookingStatus,
  setCurrentBooking,
  cancelBooking,
  setBookings,
  setMyBookings,
  setReceivedBookings,
  setLoading,
} from '@/store/slices/bookingsSlice';
import { Booking, BookingStatus, ServiceListing } from '@/models/types';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export const useBookings = () => {
  const dispatch = useAppDispatch();
  const { bookings, myBookings, receivedBookings, currentBooking, isLoading } = useAppSelector(
    state => state.bookings
  );
  const { user } = useAppSelector(state => state.auth);

  const mapStatus = (status: string): BookingStatus => {
    if (status === 'approved') return 'confirmed';
    if (status === 'rejected') return 'cancelled';
    return status as BookingStatus;
  };

  const mapBooking = useCallback((booking: any): Booking => {
    const requestedDate = booking.requested_time ? new Date(booking.requested_time) : new Date();
    const dateStr = requestedDate.toISOString().split('T')[0];
    const timeStr = requestedDate.toISOString().split('T')[1]?.slice(0, 5) || '00:00';

    return {
      id: booking.id,
      listingId: booking.service_id,
      seekerId: booking.seeker_id,
      providerId: booking.provider_id || booking.providerId || '',
      scheduledDate: dateStr,
      scheduledTime: timeStr,
      duration: 60,
      totalPrice: Number(booking.total_price || 0),
      status: mapStatus(booking.status || 'pending'),
      notes: booking.notes || undefined,
      createdAt: booking.created_at || new Date().toISOString(),
      updatedAt: booking.updated_at || booking.created_at || new Date().toISOString(),
      serviceTitle: booking.service_title || 'Service',
      serviceCategory: booking.category || undefined,
      serviceImageUrl: booking.service_image_url || undefined,
      seekerName: booking.seeker_name || undefined,
      serviceCurrency: booking.currency || booking.service_currency || 'PKR',
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadBookings = async () => {
      dispatch(setLoading(true));
      try {
        const data = await api.get<any[]>(`/bookings?user_id=${user.id}`, { auth: true });
        const mapped = data.map(mapBooking);
        dispatch(setBookings(mapped));
        dispatch(setMyBookings(mapped.filter(b => b.seekerId === user.id)));
        dispatch(setReceivedBookings(mapped.filter(b => b.providerId === user.id)));
      } catch (err) {
        toast.error('Failed to load bookings');
      } finally {
        dispatch(setLoading(false));
      }
    };

    loadBookings();
  }, [dispatch, mapBooking, user]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    const handleBookingStatusChanged = (payload: {
      bookingId?: string;
      status?: string;
      seekerId?: string;
      providerId?: string;
    }) => {
      if (!payload?.bookingId || !payload?.status) return;

      const knownBooking = bookings.some((b) => b.id === payload.bookingId);
      const userIsParticipant = payload.seekerId === user.id || payload.providerId === user.id;
      if (!knownBooking && !userIsParticipant) {
        return;
      }

      dispatch(updateBookingStatus({
        id: payload.bookingId,
        status: mapStatus(payload.status),
      }));
    };

    socket.on('booking:status-changed', handleBookingStatusChanged);

    return () => {
      socket.off('booking:status-changed', handleBookingStatusChanged);
    };
  }, [bookings, dispatch, user]);

  // Get bookings grouped by status
  const bookingsByStatus = useMemo(() => {
    const userBookings = [...myBookings, ...receivedBookings];
    
    return {
      pending: userBookings.filter(b => b.status === 'pending'),
      confirmed: userBookings.filter(b => b.status === 'confirmed'),
      inProgress: userBookings.filter(b => b.status === 'in_progress'),
      completed: userBookings.filter(b => b.status === 'completed'),
      cancelled: userBookings.filter(b => b.status === 'cancelled'),
    };
  }, [myBookings, receivedBookings]);

  // Get upcoming bookings
  const upcomingBookings = useMemo(() => {
    const userBookings = [...myBookings, ...receivedBookings];
    const now = new Date();
    
    return userBookings
      .filter(b => {
        const bookingDate = new Date(b.scheduledDate);
        return bookingDate >= now && ['pending', 'confirmed'].includes(b.status);
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [myBookings, receivedBookings]);

  const createBooking = useCallback(async (
    listing: ServiceListing,
    date: string,
    time: string,
    duration: number,
    notes?: string
  ): Promise<Booking | null> => {
    if (!user) {
      toast.error('Please login to book a service');
      return null;
    }
    
    // Validate: user cannot book their own service
    if (listing.providerId === user.id) {
      toast.error('You cannot book your own service');
      return null;
    }
    
    dispatch(setLoading(true));
    
    try {
      const requestedTime = new Date(`${date}T${time}:00`).toISOString();
      const created = await api.post<any>('/bookings', {
        service_id: listing.id,
        seeker_id: user.id,
        requested_time: requestedTime,
      }, { auth: true });

      const newBooking = mapBooking({
        ...created,
        provider_id: listing.providerId,
      });

      dispatch(addBooking({ ...newBooking, listing, seeker: user }));
      toast.success('Booking request sent!');
      return newBooking;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      toast.error(message);
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, mapBooking, user]);

  const updateStatus = useCallback(async (bookingId: string, status: BookingStatus): Promise<boolean> => {
    try {
      dispatch(updateBookingStatus({ id: bookingId, status }));
      
      const statusMessages: Record<BookingStatus, string> = {
        pending: 'Booking pending',
        confirmed: 'Booking confirmed!',
        in_progress: 'Service started',
        completed: 'Service completed!',
        cancelled: 'Booking cancelled',
        disputed: 'Dispute opened',
      };
      
      toast.success(statusMessages[status]);
      return true;
    } catch (err) {
      toast.error('Failed to update booking status');
      return false;
    }
  }, [dispatch]);

  const confirmBooking = useCallback((bookingId: string) => {
    return updateStatus(bookingId, 'confirmed');
  }, [updateStatus]);

  const startService = useCallback((bookingId: string) => {
    return updateStatus(bookingId, 'in_progress');
  }, [updateStatus]);

  const completeService = useCallback((bookingId: string) => {
    return updateStatus(bookingId, 'completed');
  }, [updateStatus]);

  const cancel = useCallback(async (bookingId: string): Promise<boolean> => {
    try {
      dispatch(cancelBooking(bookingId));
      toast.success('Booking cancelled');
      return true;
    } catch (err) {
      toast.error('Failed to cancel booking');
      return false;
    }
  }, [dispatch]);

  const acceptBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    try {
      await api.put(`/bookings/${bookingId}/accept`, {}, { auth: true });
      dispatch(updateBookingStatus({ id: bookingId, status: 'confirmed' }));
      toast.success('Booking accepted!');
      return true;
    } catch (err) {
      toast.error('Failed to accept booking');
      return false;
    }
  }, [dispatch]);

  const rejectBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    try {
      await api.put(`/bookings/${bookingId}/reject`, {}, { auth: true });
      dispatch(updateBookingStatus({ id: bookingId, status: 'cancelled' }));
      toast.success('Booking rejected');
      return true;
    } catch (err) {
      toast.error('Failed to reject booking');
      return false;
    }
  }, [dispatch]);

  const selectBooking = useCallback((booking: Booking | null) => {
    dispatch(setCurrentBooking(booking));
  }, [dispatch]);

  const getBookingById = useCallback((id: string): Booking | undefined => {
    return bookings.find(b => b.id === id);
  }, [bookings]);

  return {
    bookings,
    myBookings,
    receivedBookings,
    currentBooking,
    isLoading,
    bookingsByStatus,
    upcomingBookings,
    createBooking,
    updateStatus,
    confirmBooking,
    startService,
    completeService,
    cancel,
    acceptBooking,
    rejectBooking,
    selectBooking,
    getBookingById,
  };
};
