import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';

/**
 * Format a date for display in the UI
 */
export const formatDate = (dateString: string): string => {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return 'Today';
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  return format(date, 'MMM d, yyyy');
};

/**
 * Format a time string for display
 */
export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, 'h:mm a');
};

/**
 * Format a date-time for chat messages
 */
export const formatMessageTime = (dateString: string): string => {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  
  if (isYesterday(date)) {
    return 'Yesterday ' + format(date, 'h:mm a');
  }
  
  return format(date, 'MMM d, h:mm a');
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
};

/**
 * Get day name from day of week number
 */
export const getDayName = (dayOfWeek: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
};

/**
 * Get short day name
 */
export const getShortDayName = (dayOfWeek: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayOfWeek];
};

/**
 * Format duration in minutes to human readable
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format price for display
 */
export const formatPrice = (price: number, type: 'hourly' | 'fixed' | 'negotiable', currency: string = 'PKR'): string => {
  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    switch (type) {
      case 'hourly':
        return `${formatted}/hr`;
      case 'negotiable':
        return `~${formatted}`;
      default:
        return formatted;
    }
  } catch (error) {
    // Fallback if currency code is invalid
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    const displayValue = `${currency} ${formatted}`;
    
    switch (type) {
      case 'hourly':
        return `${displayValue}/hr`;
      case 'negotiable':
        return `~${displayValue}`;
      default:
        return displayValue;
    }
  }
};

/**
 * Format distance in km
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain a lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain a number' };
  }
  return { valid: true, message: '' };
};
