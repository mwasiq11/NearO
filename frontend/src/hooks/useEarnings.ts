import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeProviderEarningsData = (data: ProviderEarningsData): ProviderEarningsData => ({
  ...data,
  stats: {
    ...data.stats,
    totalEarnings: toNumber(data.stats.totalEarnings),
    pendingEarnings: toNumber(data.stats.pendingEarnings),
    totalBookings: toNumber(data.stats.totalBookings),
    completedBookings: toNumber(data.stats.completedBookings),
    pendingBookings: toNumber(data.stats.pendingBookings),
    totalClients: toNumber(data.stats.totalClients),
  },
  earningsByService: data.earningsByService.map((service) => ({
    ...service,
    price: toNumber(service.price),
    bookingCount: toNumber(service.bookingCount),
    completedCount: toNumber(service.completedCount),
    totalEarned: toNumber(service.totalEarned),
  })),
  monthlyTrend: data.monthlyTrend.map((entry) => ({
    ...entry,
    bookings: toNumber(entry.bookings),
    earnings: entry.earnings !== undefined ? toNumber(entry.earnings) : undefined,
    spending: entry.spending !== undefined ? toNumber(entry.spending) : undefined,
  })),
  recentBookings: data.recentBookings.map((booking) => ({
    ...booking,
    price: toNumber(booking.price),
  })),
});

const normalizeSeekerSpendingData = (data: SeekerSpendingData): SeekerSpendingData => ({
  ...data,
  stats: {
    ...data.stats,
    totalSpent: toNumber(data.stats.totalSpent),
    pendingAmount: toNumber(data.stats.pendingAmount),
    totalBookings: toNumber(data.stats.totalBookings),
    completedBookings: toNumber(data.stats.completedBookings),
    pendingBookings: toNumber(data.stats.pendingBookings),
    totalProviders: toNumber(data.stats.totalProviders),
  },
  spendingByCategory: data.spendingByCategory.map((category) => ({
    ...category,
    bookingCount: toNumber(category.bookingCount),
    completedCount: toNumber(category.completedCount),
    totalSpent: toNumber(category.totalSpent),
  })),
  monthlyTrend: data.monthlyTrend.map((entry) => ({
    ...entry,
    bookings: toNumber(entry.bookings),
    earnings: entry.earnings !== undefined ? toNumber(entry.earnings) : undefined,
    spending: entry.spending !== undefined ? toNumber(entry.spending) : undefined,
  })),
  recentBookings: data.recentBookings.map((booking) => ({
    ...booking,
    price: toNumber(booking.price),
  })),
});

interface EarningsStats {
  totalEarnings: number;
  pendingEarnings: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalClients: number;
}

interface ServiceEarnings {
  id: string;
  title: string;
  category: string;
  price: number;
  bookingCount: number;
  completedCount: number;
  totalEarned: number;
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  bookings: number;
  earnings?: number;
  spending?: number;
}

interface RecentBooking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  price: number;
  seekerId?: string;
  seekerName?: string;
  providerName?: string;
  category?: string;
  requestedTime: string;
  status: string;
  createdAt: string;
}

interface ProviderEarningsData {
  stats: EarningsStats;
  earningsByService: ServiceEarnings[];
  monthlyTrend: MonthlyData[];
  recentBookings: RecentBooking[];
}

interface SpendingStats {
  totalSpent: number;
  pendingAmount: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalProviders: number;
}

interface CategorySpending {
  category: string;
  bookingCount: number;
  completedCount: number;
  totalSpent: number;
}

interface SeekerSpendingData {
  stats: SpendingStats;
  spendingByCategory: CategorySpending[];
  monthlyTrend: MonthlyData[];
  recentBookings: RecentBooking[];
}

export const useEarnings = () => {
  const [providerData, setProviderData] = useState<ProviderEarningsData | null>(null);
  const [seekerData, setSeekerData] = useState<SeekerSpendingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ProviderEarningsData>('/earnings/provider', { auth: true });
      const normalizedData = normalizeProviderEarningsData(data);
      setProviderData(normalizedData);
      return normalizedData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch earnings';
      setError(errorMessage);
      console.error('Error fetching provider earnings:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeekerSpending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<SeekerSpendingData>('/earnings/seeker', { auth: true });
      const normalizedData = normalizeSeekerSpendingData(data);
      setSeekerData(normalizedData);
      return normalizedData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch spending';
      setError(errorMessage);
      console.error('Error fetching seeker spending:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    providerData,
    seekerData,
    loading,
    error,
    fetchProviderEarnings,
    fetchSeekerSpending,
  };
};
