-- Notifications System Migration

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('booking_accepted', 'booking_rejected', 'new_booking', 'new_message', 'review_received') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id VARCHAR(36) NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
);

-- Add unread_count to conversations for quick access
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS seeker_unread_count INT DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS provider_unread_count INT DEFAULT 0;
