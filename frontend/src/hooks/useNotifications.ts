import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface NotificationPreference {
  messages_enabled: boolean;
  bookings_enabled: boolean;
  reviews_enabled: boolean;
  promotions_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUnread = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ unread_count: number }>('/notifications/unread-count', { auth: true });
      setUnreadCount(data.unread_count || 0);
    } catch {
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  const listNotifications = useCallback(async (page = 1, limit = 20) => {
    return api.get<{ notifications: any[] }>(`/notifications?page=${page}&limit=${limit}`, { auth: true });
  }, []);

  const markRead = useCallback(async (id: string) => {
    return api.put(`/notifications/${id}/read`, undefined, { auth: true });
  }, []);

  const markAllRead = useCallback(async () => {
    return api.put('/notifications/read-all', undefined, { auth: true });
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    return api.delete(`/notifications/${id}`, undefined, { auth: true });
  }, []);

  const getPreferences = useCallback(async () => {
    return api.get<NotificationPreference>('/notifications/preferences', { auth: true });
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreference>) => {
    return api.put('/notifications/preferences', prefs, { auth: true });
  }, []);

  const saveSubscription = useCallback(async (subscription: PushSubscription) => {
    return api.post('/notifications/subscriptions', subscription, { auth: true });
  }, []);

  const removeSubscription = useCallback(async (endpoint: string) => {
    return api.delete('/notifications/subscriptions', { endpoint }, { auth: true });
  }, []);

  return {
    unreadCount,
    isLoading,
    refreshUnread,
    listNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    getPreferences,
    updatePreferences,
    saveSubscription,
    removeSubscription,
  };
};

