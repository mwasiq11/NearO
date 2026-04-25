import { Booking, BookingStatus } from '@/models/types';

const SOLD_STATUSES: BookingStatus[] = ['confirmed', 'in_progress', 'completed'];

export const isSoldBookingStatus = (status: BookingStatus): boolean => {
  return SOLD_STATUSES.includes(status);
};

export const getServiceSalesMetrics = (
  listingId: string,
  bookings: Booking[],
  fallbackPrice = 0,
  stockQuantity?: number | null,
) => {
  const serviceBookings = bookings.filter((booking) => booking.listingId === listingId);
  const soldBookings = serviceBookings.filter((booking) => isSoldBookingStatus(booking.status));
  const pendingBookings = serviceBookings.filter((booking) => booking.status === 'pending');
  const allocatedCount = soldBookings.length + pendingBookings.length;

  const totalRevenue = soldBookings.reduce((sum, booking) => {
    const effectivePrice = booking.totalPrice > 0 ? booking.totalPrice : fallbackPrice;
    return sum + effectivePrice;
  }, 0);

  const normalizedStock = typeof stockQuantity === 'number' && Number.isFinite(stockQuantity)
    ? Math.max(0, Math.floor(stockQuantity))
    : null;
  const remainingQuantity = normalizedStock === null ? null : Math.max(normalizedStock - allocatedCount, 0);
  const isInStock = remainingQuantity === null ? true : remainingQuantity > 0;

  return {
    totalOrders: serviceBookings.length,
    soldCount: soldBookings.length,
    pendingCount: pendingBookings.length,
    allocatedCount,
    totalRevenue,
    isSold: soldBookings.length > 0,
    remainingQuantity,
    isInStock,
  };
};
