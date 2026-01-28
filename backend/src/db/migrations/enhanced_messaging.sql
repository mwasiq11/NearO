-- Enhanced Messaging System - Support for multimedia messages

-- Drop existing messages table and recreate with enhanced fields
DROP TABLE IF EXISTS messages;

CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  message_type ENUM('text', 'image', 'voice', 'file') DEFAULT 'text',
  content TEXT NULL,
  file_url VARCHAR(500) NULL,
  file_name VARCHAR(255) NULL,
  file_size INT NULL,
  file_type VARCHAR(100) NULL,
  duration INT NULL COMMENT 'Duration in seconds for voice messages',
  thumbnail_url VARCHAR(500) NULL COMMENT 'Thumbnail for images/videos',
  status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_conversation (conversation_id),
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_status (status),
  INDEX idx_message_type (message_type),
  INDEX idx_created_at (created_at)
);

-- Add profile picture URL to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500) NULL AFTER email;

-- Create uploads directory structure table for tracking
CREATE TABLE IF NOT EXISTS file_uploads (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  upload_context ENUM('message_image', 'message_voice', 'profile_picture', 'service_image') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_upload_context (upload_context),
  INDEX idx_created_at (created_at)
);

-- Add last_message_preview to conversations for better UX
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT NULL AFTER last_message_at;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_type ENUM('text', 'image', 'voice', 'file') NULL AFTER last_message_preview;
