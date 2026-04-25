-- Migration: Add Rating and Review System
-- Description: Safely extends services table and configures reviews table

-- 1. Extend services table with rating aggregates
ALTER TABLE services
ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN total_reviews INT DEFAULT 0;

-- 2. Add indexes for performance
CREATE INDEX idx_services_rating ON services(average_rating);
CREATE INDEX idx_services_reviews ON services(total_reviews);

-- 3. Add unique constraint to reviews to ensure one review per user per service
-- Note: booking_id is already unique in this system
ALTER TABLE reviews
ADD CONSTRAINT unique_user_service UNIQUE (reviewer_id, service_id);

-- 4. Initial calculation (in case there are existing reviews)
-- This is optional but good for consistency
UPDATE services s
SET 
    s.average_rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews r WHERE r.service_id = s.id), 0),
    s.total_reviews = (SELECT COUNT(*) FROM reviews r WHERE r.service_id = s.id);
