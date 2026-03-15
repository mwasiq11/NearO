// Core Types for NearO Marketplace

// User Roles
export type UserRole = 'user' | 'moderator' | 'admin';

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  bio?: string;
  skills?: string[];
  isVerified: boolean;
  createdAt: string;
  reputation: ReputationScore;
}

export interface ReputationScore {
  overall: number; // 0-5
  totalReviews: number;
  reliabilityScore: number; // Weighted long-term score
  responseRate: number; // Percentage
  completionRate: number; // Percentage
  badge: 'gold' | 'silver' | 'bronze' | 'new';
  recentTrend: 'up' | 'down' | 'stable';
}

// Service Listing Types
export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface ServiceListing {
  id: string;
  providerId: string;
  provider?: User;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  priceType: 'hourly' | 'fixed' | 'negotiable';
  images: string[];
  availability: AvailabilitySlot[];
  location: {
    neighborhood: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    radius: number; // Service radius in km
  };
  tags: string[];
  rating: number;
  reviewCount: number;
  bookingCount: number;
  isActive: boolean;
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isRecurring: boolean;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export interface Booking {
  id: string;
  listingId: string;
  listing?: ServiceListing;
  seekerId: string;
  seeker?: User;
  providerId: string;
  provider?: User;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  serviceTitle?: string;
  serviceCategory?: string;
  serviceImageUrl?: string;
  seekerName?: string;
  seekerReview?: Review;
  providerReview?: Review;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1-5
  comment: string;
  aspects: {
    quality: number;
    communication: number;
    punctuality: number;
    value: number;
  };
  createdAt: string;
}

// Chat/Messaging Types
export interface Conversation {
  id: string;
  participants: string[];
  participantDetails?: User[];
  lastMessage?: Message;
  unreadCount: number;
  listingId?: string;
  listing?: ServiceListing;
  createdAt: string;
  updatedAt: string;
  last_message_at?: string;
  service_title?: string;
  last_message_preview?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender_id?: string;
  content: string;
  type: 'text' | 'image' | 'booking_request' | 'booking_update' | 'file' | 'voice';
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// Filter & Search Types
export interface SearchFilters {
  query: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  radius: number; // in km
  neighborhood?: string;
  rating?: number;
  availability?: string;
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'distance' | 'trending';
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'booking_new' | 'booking_accepted' | 'booking_rejected' | 'new_message' | 'review_posted' | 'system';
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

// Trending/Discovery Types
export interface TrendingData {
  neighborhood: string;
  services: TrendingService[];
  updatedAt: string;
}

export interface TrendingService {
  categoryId: string;
  categoryName: string;
  bookingCount: number;
  growthRate: number; // Percentage increase from last period
  topListings: ServiceListing[];
}

// Geospatial Types
export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface GeoCell {
  h3Index: string;
  neighborhood: string;
  city: string;
  serviceCount: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export interface ListingForm {
  title: string;
  description: string;
  category: string;
  price: number;
  priceType: 'hourly' | 'fixed' | 'negotiable';
  images: File[];
  image_url?: string;
  tags: string[];
  radius: number;
  neighborhood?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}
