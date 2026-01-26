import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables: use .env by default, .env.test in test
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const readDbConfig = {
  host: process.env.READ_DB_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.READ_DB_PORT || process.env.DB_PORT || 3306,
  user: process.env.READ_DB_USER || process.env.DB_USER,
  password: process.env.READ_DB_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.READ_DB_NAME || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pools
const pool = mysql.createPool(dbConfig);
let readPool = mysql.createPool(readDbConfig);

// Test connection and initialize schema
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    // Database is already specified in pool config, create tables directly
    await createTables(connection);

    connection.release();

    try {
      const readConnection = await readPool.getConnection();
      readConnection.release();
    } catch (error) {
      console.warn('⚠️ Read DB connection failed, falling back to primary:', error.message);
      readPool = pool;
    }

    console.log('✅ MySQL database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

async function createTables(connection) {
  if (process.env.RESET_DB === 'true') {
    // Drop tables in reverse dependency order when explicitly requested
    await connection.execute(`DROP TABLE IF EXISTS user_search_history`);
    await connection.execute(`DROP TABLE IF EXISTS user_push_subscriptions`);
    await connection.execute(`DROP TABLE IF EXISTS notification_preferences`);
    await connection.execute(`DROP TABLE IF EXISTS admin_action_logs`);
    await connection.execute(`DROP TABLE IF EXISTS user_warnings`);
    await connection.execute(`DROP TABLE IF EXISTS notifications`);
    await connection.execute(`DROP TABLE IF EXISTS messages`);
    await connection.execute(`DROP TABLE IF EXISTS conversations`);
    await connection.execute(`DROP TABLE IF EXISTS user_presence`);
    await connection.execute(`DROP TABLE IF EXISTS reviews`);
    await connection.execute(`DROP TABLE IF EXISTS audit_logs`);
    await connection.execute(`DROP TABLE IF EXISTS system_settings`);
    await connection.execute(`DROP TABLE IF EXISTS user_reports`);
    await connection.execute(`DROP TABLE IF EXISTS password_resets`);
    await connection.execute(`DROP TABLE IF EXISTS email_verifications`);
    await connection.execute(`DROP TABLE IF EXISTS user_sessions`);
    await connection.execute(`DROP TABLE IF EXISTS service_categories`);
    await connection.execute(`DROP TABLE IF EXISTS bookings`);
    await connection.execute(`DROP TABLE IF EXISTS services`);
    await connection.execute(`DROP TABLE IF EXISTS users`);
  }

  // Users table - Stage 2 with RBAC
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
      is_active BOOLEAN DEFAULT TRUE,
      is_verified BOOLEAN DEFAULT FALSE,
      email_verified_at TIMESTAMP NULL,
      last_login_at TIMESTAMP NULL,
      suspended_until TIMESTAMP NULL,
      suspension_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_is_active (is_active)
    )
  `);

  // Seed hardcoded admin user if missing
  const adminEmail = 'admin@example.com';
  const [adminRows] = await connection.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (adminRows.length === 0) {
    const adminPassword = 'Admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await connection.execute(
      'INSERT INTO users (id, name, email, password, role, is_active, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), 'Admin', adminEmail, adminHash, 'admin', true, true]
    );
  }

  // Services table - Stage 2 with location
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id VARCHAR(36) PRIMARY KEY,
      provider_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      availability TEXT NOT NULL,
      latitude DECIMAL(10,8) NULL,
      longitude DECIMAL(11,8) NULL,
      s2_cell_id BIGINT UNSIGNED NULL,
      neighborhood VARCHAR(255) NULL,
      city VARCHAR(255) NULL,
      is_active BOOLEAN DEFAULT TRUE,
      moderated_at TIMESTAMP NULL,
      moderated_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_provider (provider_id),
      INDEX idx_category (category),
      INDEX idx_location (latitude, longitude),
      INDEX idx_s2_cell (s2_cell_id),
      INDEX idx_neighborhood (neighborhood),
      INDEX idx_city (city),
      INDEX idx_is_active (is_active)
    )
  `);

  // Bookings table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(36) PRIMARY KEY,
      service_id VARCHAR(36) NOT NULL,
      seeker_id VARCHAR(36) NOT NULL,
      requested_time VARCHAR(255) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_service (service_id),
      INDEX idx_seeker (seeker_id),
      INDEX idx_status (status)
    )
  `);

  // User Sessions table (JWT refresh tokens)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at)
    )
  `);

  // Email Verifications table
  await connection.execute(`
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
    )
  `);

  // Password Reset Tokens table
  await connection.execute(`
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
    )
  `);

  // User Reports table (for moderation)
  await connection.execute(`
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
    )
  `);

  // Real-time messaging: Conversations table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(36) PRIMARY KEY,
      seeker_id VARCHAR(36) NOT NULL,
      provider_id VARCHAR(36) NOT NULL,
      service_id VARCHAR(36) NULL,
      last_message_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
      UNIQUE KEY uniq_conversation (seeker_id, provider_id, service_id),
      INDEX idx_seeker (seeker_id),
      INDEX idx_provider (provider_id),
      INDEX idx_service (service_id),
      INDEX idx_last_message (last_message_at)
    )
  `);

  // Real-time messaging: Messages table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      conversation_id VARCHAR(36) NOT NULL,
      sender_id VARCHAR(36) NOT NULL,
      receiver_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_conversation (conversation_id),
      INDEX idx_sender (sender_id),
      INDEX idx_receiver (receiver_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )
  `);

  // User presence table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS user_presence (
      user_id VARCHAR(36) PRIMARY KEY,
      status ENUM('online', 'offline') DEFAULT 'offline',
      socket_id VARCHAR(255) NULL,
      last_seen TIMESTAMP NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_status (status),
      INDEX idx_last_seen (last_seen)
    )
  `);

  // Notifications table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      type VARCHAR(100) NOT NULL,
      payload JSON NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_is_read (is_read),
      INDEX idx_created_at (created_at)
    )
  `);

  // Notification preferences table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id VARCHAR(36) PRIMARY KEY,
      messages_enabled BOOLEAN DEFAULT TRUE,
      bookings_enabled BOOLEAN DEFAULT TRUE,
      reviews_enabled BOOLEAN DEFAULT TRUE,
      promotions_enabled BOOLEAN DEFAULT FALSE,
      email_notifications BOOLEAN DEFAULT TRUE,
      push_notifications BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // User push subscriptions table (for web push)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS user_push_subscriptions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh_key TEXT NOT NULL,
      auth_key TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id)
    )
  `);

  // User search history table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS user_search_history (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      search_query VARCHAR(255) NULL,
      category VARCHAR(100) NULL,
      city VARCHAR(100) NULL,
      neighborhood VARCHAR(100) NULL,
      filters JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_category (category),
      INDEX idx_city (city),
      INDEX idx_created_at (created_at)
    )
  `);

  // Reviews table (reputation engine)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(36) PRIMARY KEY,
      provider_id VARCHAR(36) NOT NULL,
      reviewer_id VARCHAR(36) NOT NULL,
      service_id VARCHAR(36) NOT NULL,
      booking_id VARCHAR(36) NOT NULL,
      rating TINYINT NOT NULL,
      comment TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_review (booking_id),
      INDEX idx_provider (provider_id),
      INDEX idx_reviewer (reviewer_id),
      INDEX idx_service (service_id),
      INDEX idx_rating (rating),
      INDEX idx_created_at (created_at)
    )
  `);

  // User Warnings table (moderation warnings)
  await connection.execute(`
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
    )
  `);

  // Admin Action Logs table
  await connection.execute(`
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
    )
  `);

  // Immutable Audit Logs table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      actor_id VARCHAR(36) NULL,
      action_type VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(36) NULL,
      old_value JSON NULL,
      new_value JSON NULL,
      metadata JSON NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_actor_id (actor_id),
      INDEX idx_action_type (action_type),
      INDEX idx_entity (entity_type, entity_id),
      INDEX idx_created_at (created_at)
    )
  `);

  // System Settings table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id VARCHAR(36) PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT NULL,
      updated_by VARCHAR(36) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_setting_key (setting_key)
    )
  `);

  // Service Categories table (dynamic categories)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_is_active (is_active)
    )
  `);

  // Insert default categories
  const defaultCategories = [
    ['Plumbing', 'Plumbing services and repairs'],
    ['Electrical', 'Electrical work and repairs'],
    ['Cleaning', 'House cleaning and maintenance'],
    ['Gardening', 'Garden maintenance and landscaping'],
    ['Tutoring', 'Educational and tutoring services'],
    ['Pet Care', 'Pet sitting and care services'],
    ['Repair', 'General repair services'],
    ['Delivery', 'Delivery and pickup services'],
    ['Cooking', 'Cooking and meal preparation'],
    ['Other', 'Other services']
  ];

  for (const [name, description] of defaultCategories) {
    await connection.execute(
      'INSERT INTO service_categories (id, name, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = name',
      [uuidv4(), name, description]
    );
  }

  // Insert default system settings
  await connection.execute(
    'INSERT INTO system_settings (id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
    [uuidv4(), 'maintenance_mode', 'false']
  );
  await connection.execute(
    'INSERT INTO system_settings (id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
    [uuidv4(), 'maintenance_message', 'System is under maintenance. Please try again later.']
  );

  console.log('📋 Database tables created successfully');
}

export { pool, readPool, initializeDatabase };
