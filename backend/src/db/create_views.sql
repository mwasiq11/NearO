-- ============================================================
-- DATABASE VIEWS FOR COMPLETE USER INFORMATION
-- ============================================================
-- This file creates views that show all user information in one place
-- while keeping the database properly normalized

-- ============================================================
-- VIEW 1: Complete User Profile with Statistics
-- ============================================================
-- Shows user info + counts of services provided, bookings made, reviews
DROP VIEW IF EXISTS user_complete_profile;

CREATE VIEW user_complete_profile AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.phone,
    u.city,
    u.neighborhood,
    u.profile_picture,
    u.is_active,
    u.is_verified,
    u.created_at,
    u.last_login_at,
    
    -- Services provided by this user
    COUNT(DISTINCT s.id) as total_services_provided,
    
    -- Bookings made by this user (as seeker)
    COUNT(DISTINCT b.id) as total_bookings_made,
    
    -- Bookings received by this user (as provider)
    COUNT(DISTINCT br.id) as total_bookings_received,
    
    -- Reviews written by this user
    COUNT(DISTINCT rw.id) as total_reviews_written,
    
    -- Reviews received by this user (as provider)
    COUNT(DISTINCT rr.id) as total_reviews_received,
    
    -- Average rating as provider
    ROUND(AVG(rr.rating), 2) as avg_rating_as_provider

FROM users u
LEFT JOIN services s ON u.id = s.provider_id
LEFT JOIN bookings b ON u.id = b.seeker_id
LEFT JOIN bookings br ON s.id = br.service_id
LEFT JOIN reviews rw ON u.id = rw.reviewer_id
LEFT JOIN reviews rr ON u.id = rr.provider_id

GROUP BY u.id, u.name, u.email, u.role, u.phone, u.city, u.neighborhood, 
         u.profile_picture, u.is_active, u.is_verified, u.created_at, u.last_login_at;


-- ============================================================
-- VIEW 2: User Services Detail
-- ============================================================
-- Shows each user with ALL their provided services
DROP VIEW IF EXISTS user_services_detail;

CREATE VIEW user_services_detail AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.city as user_city,
    u.neighborhood as user_neighborhood,
    
    s.id as service_id,
    s.title as service_title,
    s.description as service_description,
    s.category as service_category,
    s.price as service_price,
    s.is_active as service_active,
    s.created_at as service_created_at,
    
    -- Count bookings for this service
    COUNT(DISTINCT b.id) as service_booking_count,
    
    -- Count reviews for this service
    COUNT(DISTINCT r.id) as service_review_count,
    
    -- Average rating for this service
    ROUND(AVG(r.rating), 2) as service_avg_rating

FROM users u
LEFT JOIN services s ON u.id = s.provider_id
LEFT JOIN bookings b ON s.id = b.service_id
LEFT JOIN reviews r ON s.id = r.service_id

GROUP BY u.id, u.name, u.email, u.city, u.neighborhood,
         s.id, s.title, s.description, s.category, s.price, s.is_active, s.created_at;


-- ============================================================
-- VIEW 3: User Bookings Detail (As Seeker)
-- ============================================================
-- Shows each user with ALL services they've booked
DROP VIEW IF EXISTS user_bookings_as_seeker;

CREATE VIEW user_bookings_as_seeker AS
SELECT 
    u.id as seeker_id,
    u.name as seeker_name,
    u.email as seeker_email,
    
    b.id as booking_id,
    b.requested_time,
    b.status as booking_status,
    b.created_at as booking_date,
    
    s.id as service_id,
    s.title as service_title,
    s.category as service_category,
    s.price as service_price,
    
    p.id as provider_id,
    p.name as provider_name,
    p.email as provider_email,
    p.phone as provider_phone,
    p.city as provider_city,
    p.neighborhood as provider_neighborhood

FROM users u
JOIN bookings b ON u.id = b.seeker_id
JOIN services s ON b.service_id = s.id
JOIN users p ON s.provider_id = p.id;


-- ============================================================
-- VIEW 4: User Bookings Detail (As Provider)
-- ============================================================
-- Shows each provider with ALL bookings for their services
DROP VIEW IF EXISTS user_bookings_as_provider;

CREATE VIEW user_bookings_as_provider AS
SELECT 
    p.id as provider_id,
    p.name as provider_name,
    p.email as provider_email,
    
    s.id as service_id,
    s.title as service_title,
    s.category as service_category,
    
    b.id as booking_id,
    b.requested_time,
    b.status as booking_status,
    b.created_at as booking_date,
    
    u.id as seeker_id,
    u.name as seeker_name,
    u.email as seeker_email,
    u.phone as seeker_phone,
    u.city as seeker_city,
    u.neighborhood as seeker_neighborhood

FROM users p
JOIN services s ON p.id = s.provider_id
JOIN bookings b ON s.id = b.service_id
JOIN users u ON b.seeker_id = u.id;


-- ============================================================
-- VIEW 5: Complete User Activity
-- ============================================================
-- MASTER VIEW: Shows EVERYTHING about a user
DROP VIEW IF EXISTS user_complete_activity;

CREATE VIEW user_complete_activity AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.role,
    u.phone,
    u.city,
    u.neighborhood,
    u.profile_picture,
    u.is_active,
    u.is_verified,
    u.created_at as user_registered_at,
    
    -- Services they provide
    GROUP_CONCAT(DISTINCT CONCAT(s.title, ' (', s.category, ')') SEPARATOR ' | ') as services_provided,
    COUNT(DISTINCT s.id) as services_provided_count,
    
    -- Services they've booked
    GROUP_CONCAT(DISTINCT CONCAT(bs.title, ' from ', prov.name) SEPARATOR ' | ') as services_booked,
    COUNT(DISTINCT b.id) as services_booked_count,
    
    -- Reviews written
    COUNT(DISTINCT rw.id) as reviews_written_count,
    
    -- Reviews received
    COUNT(DISTINCT rr.id) as reviews_received_count,
    ROUND(AVG(rr.rating), 2) as avg_rating_received

FROM users u
LEFT JOIN services s ON u.id = s.provider_id
LEFT JOIN bookings b ON u.id = b.seeker_id
LEFT JOIN services bs ON b.service_id = bs.id
LEFT JOIN users prov ON bs.provider_id = prov.id
LEFT JOIN reviews rw ON u.id = rw.reviewer_id
LEFT JOIN reviews rr ON u.id = rr.provider_id

GROUP BY u.id, u.name, u.email, u.role, u.phone, u.city, u.neighborhood,
         u.profile_picture, u.is_active, u.is_verified, u.created_at;
