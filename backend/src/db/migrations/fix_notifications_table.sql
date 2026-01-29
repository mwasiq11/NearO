-- Fix notifications table to support messaging system

-- Check and add missing columns to notifications table (using separate statements)
SET @dbname = DATABASE();
SET @tablename = 'notifications';

-- Add title column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'title');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NULL AFTER type', 
  'SELECT "Column title already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add message column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'message');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE notifications ADD COLUMN message TEXT NULL AFTER title', 
  'SELECT "Column message already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add entity_type column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'entity_type');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE notifications ADD COLUMN entity_type VARCHAR(50) NULL AFTER message', 
  'SELECT "Column entity_type already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add entity_id column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'entity_id');
SET @query = IF(@col_exists = 0, 
  'ALTER TABLE notifications ADD COLUMN entity_id VARCHAR(36) NULL AFTER entity_type', 
  'SELECT "Column entity_id already exists" AS msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify type column to be VARCHAR instead of ENUM to support more notification types
ALTER TABLE notifications MODIFY COLUMN type VARCHAR(100) NOT NULL;
