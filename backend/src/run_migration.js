import mysql from 'mysql2/promise';

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements:true
  });


  try {
    console.log('Running add_notifications.sql migration...');
    
    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type ENUM('booking_accepted', 'booking_rejected', 'new_booking', 'new_message', 'review_received') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        entity_type VARCHAR(50) NULL,
        entity_id VARCHAR(36) NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read),
        INDEX idx_created_at (created_at),
        INDEX idx_type (type)
      )
    `);
    console.log('✅ Created notifications table');
    
    // Check and add seeker_unread_count column
    const [convColumns1] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nearo' 
      AND TABLE_NAME = 'conversations' 
      AND COLUMN_NAME = 'seeker_unread_count'
    `);
    
    if (convColumns1.length === 0) {
      await connection.query('ALTER TABLE conversations ADD COLUMN seeker_unread_count INT DEFAULT 0');
      console.log('✅ Added seeker_unread_count column to conversations table');
    } else {
      console.log('ℹ️  seeker_unread_count column already exists');
    }
    
    // Check and add provider_unread_count column
    const [convColumns2] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nearo' 
      AND TABLE_NAME = 'conversations' 
      AND COLUMN_NAME = 'provider_unread_count'
    `);
    
    if (convColumns2.length === 0) {
      await connection.query('ALTER TABLE conversations ADD COLUMN provider_unread_count INT DEFAULT 0');
      console.log('✅ Added provider_unread_count column to conversations table');
    } else {
      console.log('ℹ️  provider_unread_count column already exists');
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration();
