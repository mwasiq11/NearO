-- Stage 3 Migration: National Scale Up - Real Time & High Scale

-- Real-time messaging: Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  seeker_id VARCHAR(36) NOT NULL,
  provider_id VARCHAR(36) NOT NULL,
  service_id VARCHAR(36) NULL,
  last_message_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_conversation (seeker_id, provider_id, service_id),
  INDEX idx_seeker (seeker_id),
  INDEX idx_provider (provider_id),
  INDEX idx_service (service_id),
  INDEX idx_last_message (last_message_at)
);

-- Real-time messaging: Messages
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_conversation (conversation_id),
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- User presence table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id VARCHAR(36) PRIMARY KEY,
  status ENUM('online', 'offline') DEFAULT 'offline',
  socket_id VARCHAR(255) NULL,
  last_seen TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_last_seen (last_seen)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(100) NOT NULL,
  payload JSON NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);

-- Reviews table (reputation engine)
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  provider_id VARCHAR(36) NOT NULL,
  reviewer_id VARCHAR(36) NOT NULL,
  service_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36) NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_review (booking_id),
  INDEX idx_provider (provider_id),
  INDEX idx_reviewer (reviewer_id),
  INDEX idx_service (service_id),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at)
);

-- Immutable Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  actor_id VARCHAR(36) NULL,
  action_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36) NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  metadata JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_actor_id (actor_id),
  INDEX idx_action_type (action_type),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id VARCHAR(36) PRIMARY KEY,
  messages_enabled BOOLEAN DEFAULT TRUE,
  bookings_enabled BOOLEAN DEFAULT TRUE,
  reviews_enabled BOOLEAN DEFAULT TRUE,
  promotions_enabled BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User push subscriptions table (for web push)
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- User search history table
CREATE TABLE IF NOT EXISTS user_search_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  search_query VARCHAR(255) NULL,
  category VARCHAR(100) NULL,
  city VARCHAR(100) NULL,
  neighborhood VARCHAR(100) NULL,
  filters JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_category (category),
  INDEX idx_city (city),
  INDEX idx_created_at (created_at)
);

