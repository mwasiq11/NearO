-- Migration: Add OTP Verification System
-- Description: Replace email verification link with OTP-based verification for new user sign-ups
-- Date: 2026-02-01

-- Create table for storing OTPs
CREATE TABLE IF NOT EXISTS user_otps (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_otp_code (otp_code),
  INDEX idx_expires_at (expires_at)
);

-- Add indexes for better query performance
CREATE INDEX idx_otp_verification ON user_otps(user_id, otp_code, verified_at);
