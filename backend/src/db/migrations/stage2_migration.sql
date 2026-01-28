-- Stage 2 Migration: Urban Expansion - Multi-City Network
-- This migration adds RBAC, location services, and enhanced features

-- Enhanced Users Table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT NULL;

-- Migrate existing roles to new role system
UPDATE users SET role = 'user' WHERE role IN ('provider', 'seeker', 'both');

-- Enhanced Services Table
ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) NULL,
  ADD COLUMN IF NOT EXISTS s2_cell_id BIGINT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS moderated_by VARCHAR(36) NULL;

-- Add spatial indexes for location queries
CREATE INDEX IF NOT EXISTS idx_location ON services(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_s2_cell ON services(s2_cell_id);
CREATE INDEX IF NOT EXISTS idx_neighborhood ON services(neighborhood);
CREATE INDEX IF NOT EXISTS idx_city ON services(city);
CREATE INDEX IF NOT EXISTS idx_is_active ON services(is_active);

-- User Sessions Table (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Email Verifications Table
CREATE TABLE IF NOT EXISTS email_verifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_resets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);

-- User Reports Table (for moderation)
CREATE TABLE IF NOT EXISTS user_reports (
  id VARCHAR(36) PRIMARY KEY,
  reported_user_id VARCHAR(36) NOT NULL,
  reported_by VARCHAR(36) NOT NULL,
  service_id VARCHAR(36) NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
  reviewed_by VARCHAR(36) NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reported_user (reported_user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- User Warnings Table (moderation warnings)
CREATE TABLE IF NOT EXISTS user_warnings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  warned_by VARCHAR(36) NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (warned_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_warned_by (warned_by),
  INDEX idx_created_at (created_at)
);

-- Admin Action Logs Table
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id VARCHAR(36) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_id VARCHAR(36) NOT NULL,
  target_type VARCHAR(50) NULL,
  target_id VARCHAR(36) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_action (action),
  INDEX idx_actor_id (actor_id),
  INDEX idx_target_type (target_type),
  INDEX idx_created_at (created_at)
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id VARCHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NULL,
  updated_by VARCHAR(36) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_setting_key (setting_key)
);

-- Service Categories Table (dynamic categories)
CREATE TABLE IF NOT EXISTS service_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
);

-- Insert default categories (expanded list)
INSERT IGNORE INTO service_categories (id, name, description) VALUES
  (UUID(), 'Plumbing', 'Plumbing services and repairs'),
  (UUID(), 'Electrical', 'Electrical work and repairs'),
  (UUID(), 'Cleaning', 'House cleaning and maintenance'),
  (UUID(), 'Gardening', 'Garden maintenance and landscaping'),
  (UUID(), 'Tutoring', 'Educational and tutoring services'),
  (UUID(), 'Pet Care', 'Pet sitting and care services'),
  (UUID(), 'Repair', 'General repair services'),
  (UUID(), 'Delivery', 'Delivery and pickup services'),
  (UUID(), 'Cooking', 'Cooking and meal preparation'),
  (UUID(), 'Fitness', 'Personal training and fitness coaching'),
  (UUID(), 'Training', 'Professional training and workshops'),
  (UUID(), 'Computing', 'IT support and computer services'),
  (UUID(), 'Web Development', 'Website design and development'),
  (UUID(), 'Graphic Design', 'Design and creative services'),
  (UUID(), 'Photography', 'Photography and videography services'),
  (UUID(), 'Music Lessons', 'Music instruction and lessons'),
  (UUID(), 'Beauty & Wellness', 'Beauty treatments and wellness services'),
  (UUID(), 'Moving & Transportation', 'Moving and transportation services'),
  (UUID(), 'Automotive', 'Car maintenance and repair services'),
  (UUID(), 'Legal Services', 'Legal consultation and services'),
  (UUID(), 'Other', 'Other services');

-- Insert default system settings
INSERT IGNORE INTO system_settings (id, setting_key, setting_value) VALUES
  (UUID(), 'maintenance_mode', 'false'),
  (UUID(), 'maintenance_message', 'System is under maintenance. Please try again later.');

