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
  const { notifications, unreadCount, isLoading } = useAppSelector((state) => state.notifications);
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
        } else if (notification.payload?.serviceId) {
          navigate(`/dashboard/listing/${notification.payload.serviceId}`);
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
    const baseClass = "h-5 w-5 bg-muted text-muted-foreground p-1.5 rounded-full";
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
        <Button variant="ghost" size="icon" className="relative hover:bg-accent transition-all duration-200">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 h-3 w-3 bg-primary rounded-full flex items-center justify-center text-[8px] text-primary-foreground font-bold border-2 border-background">
              {unreadCount > 9 ? '!' : unreadCount}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-lg border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3 bg-popover border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground text-sm">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                NEW
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              Clear All
            </button>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          {isLoading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[11px] text-muted-foreground gap-2">
                <div className="h-4 w-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
              <p>Syncing...</p>
            </div>
          ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[11px] text-muted-foreground gap-2">
              <Bell className="h-5 w-5 opacity-20" />
              <p>Nothing here</p>
            </div>
          ) : (
            <div className="grid divide-y divide-border/40">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 transition-colors cursor-pointer hover:bg-accent/40 relative ${
                    !notification.is_read ? 'bg-accent/20' : ''
                  }`}
                  onClick={() => handleAction(notification)}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[12px] leading-tight truncate ${
                        !notification.is_read ? 'font-bold text-foreground' : 'text-muted-foreground'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[9px] text-muted-foreground/80 font-bold uppercase tracking-tight pt-1">
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
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
