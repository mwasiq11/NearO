-- Add missing user profile fields

-- Add phone column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'users';

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'phone');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER email', 
  'SELECT "Column phone already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add neighborhood column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'neighborhood');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN neighborhood VARCHAR(100) NULL AFTER phone', 
  'SELECT "Column neighborhood already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add city column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'city');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL AFTER neighborhood', 
  'SELECT "Column city already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add latitude column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'latitude');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER city', 
  'SELECT "Column latitude already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add longitude column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'longitude');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude', 
  'SELECT "Column longitude already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add profile_picture column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'profile_picture');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) NULL AFTER longitude', 
  'SELECT "Column profile_picture already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
