import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Clock, Mail, Star, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../../store/slices/notificationsSlice';
import type { Notification } from '../../models/types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { getSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { addNotification } from '../../store/slices/notificationsSlice';
import { api } from '@/lib/api';

export default function NotificationDropdown() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useAppSelector((state) => state.notifications);
  const { playNotificationSound } = useNotificationSound();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUnreadCount());
    
    // Listen for real-time notifications
    const socket = getSocket();
    
    const handleNotificationReceived = async (notification: any) => {
      // Update Redux state
      dispatch(addNotification(notification));
      
      // Play sound
      playNotificationSound();
      
      // Show Toast with navigation action
      try {
        const userPrefs = await api.get<any>('/users/me/preferences', { auth: true });
        if (userPrefs?.toast_enabled !== false) {
          toast(notification.title, {
            description: notification.message,
            icon: getNotificationIcon(notification.type),
            action: {
              label: 'View',
              onClick: () => handleAction(notification)
            }
          });
        }
      } catch (err) {
        toast(notification.title, { description: notification.message });
      }
    };

    const handleBookingStatusChanged = (data: any) => {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    };
    
    socket.on('notification:received', handleNotificationReceived);
    socket.on('booking:status-changed', handleBookingStatusChanged);
    
    return () => {
      socket.off('notification:received', handleNotificationReceived);
      socket.off('booking:status-changed', handleBookingStatusChanged);
    };
  }, [dispatch, playNotificationSound]);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications());
    }
  }, [isOpen, dispatch]);

  const handleAction = (notification: Notification) => {
    // 1. Mark as read
    if (!notification.is_read) {
      dispatch(markAsRead(notification.id));
    }

    // 2. Close dropdown
    setIsOpen(false);

    // 3. Navigate based on type and entity
    switch (notification.type) {
      case 'new_message':
      case 'message':
        if (notification.entity_id || notification.payload?.conversationId) {
          navigate(`/dashboard/messages?conversationId=${notification.entity_id || notification.payload.conversationId}`);
        } else {
          navigate('/dashboard/messages');
        }
        break;
      
      case 'booking_new':
      case 'booking_request':
      case 'booking_accepted':
      case 'booking_approved':
      case 'booking_rejected':
        if (notification.entity_id || notification.payload?.bookingId) {
          navigate(`/dashboard/bookings/${notification.entity_id || notification.payload.bookingId}`);
        } else {
          navigate('/dashboard/bookings');
        }
        break;

      case 'review_posted':
      case 'review':
        navigate('/dashboard/my-services');
        break;
      
      default:
        navigate('/dashboard');
    }
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllAsRead());
    dispatch(fetchUnreadCount());
  };

  const getNotificationIcon = (type: string) => {
    const baseClass = "h-5 w-5 bg-slate-100 text-slate-400 p-1.5 rounded-full";
    switch (type) {
      case 'booking_new':
      case 'booking_request':
        return <Calendar className={baseClass} />;
      case 'booking_accepted':
      case 'booking_approved':
        return <Check className={baseClass} />;
      case 'booking_rejected':
        return <Clock className={baseClass} />;
      case 'new_message':
      case 'message':
        return <Mail className={baseClass} />;
      case 'review_posted':
      case 'review':
        return <Star className={baseClass} />;
      default:
        return <Bell className={baseClass} />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-50 transition-all duration-200">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 h-3 w-3 bg-slate-800 rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-white">
              {unreadCount > 9 ? '!' : unreadCount}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-lg border-slate-200 shadow-lg animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                NEW
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              Clear All
            </button>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[11px] text-slate-400 gap-2">
              <div className="h-4 w-4 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
              <p>Syncing...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[11px] text-slate-400 gap-2">
              <Bell className="h-5 w-5 opacity-20" />
              <p>Nothing here</p>
            </div>
          ) : (
            <div className="grid divide-y divide-slate-50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 transition-colors cursor-pointer hover:bg-slate-50 relative ${
                    !notification.is_read ? 'bg-slate-50/50' : ''
                  }`}
                  onClick={() => handleAction(notification)}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[12px] leading-tight truncate ${
                        !notification.is_read ? 'font-bold text-slate-900' : 'text-slate-600'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight pt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-center">
            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">
              NearO Update System
            </span>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
