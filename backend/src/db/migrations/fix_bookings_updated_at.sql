-- Migration: Add updated_at column to bookings table
-- Date: January 28, 2026
-- Purpose: Fix missing updated_at column in bookings table

-- Add updated_at column to bookings table if it doesn't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Verify the change
DESCRIBE bookings;
