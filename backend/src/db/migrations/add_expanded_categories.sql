-- Add new categories to existing database
-- Run this script to add the expanded category list

INSERT IGNORE INTO service_categories (id, name, description, is_active) VALUES
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
  (UUID(), 'Legal Services', 'Legal consultation and services');

-- Note: The IGNORE keyword prevents errors if categories already exist
SELECT COUNT(*) as total_categories FROM service_categories WHERE is_active = TRUE;
