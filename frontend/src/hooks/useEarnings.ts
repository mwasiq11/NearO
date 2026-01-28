import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

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
      setProviderData(data);
      return data;
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
      setSeekerData(data);
      return data;
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
