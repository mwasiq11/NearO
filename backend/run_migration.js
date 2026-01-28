import mysql from 'mysql2/promise';

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Wasiq00001',
    database: 'nearo',
    multipleStatements: true
  });

  try {
    console.log('Running enhanced_messaging.sql migration...');
    
    // Drop and recreate messages table with new columns
    await connection.query('DROP TABLE IF EXISTS messages');
    console.log('✅ Dropped old messages table');
    
    await connection.query(`
      CREATE TABLE messages (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        receiver_id VARCHAR(36) NOT NULL,
        message_type ENUM('text', 'image', 'voice', 'file') DEFAULT 'text',
        content TEXT NULL,
        file_url VARCHAR(500) NULL,
        file_name VARCHAR(255) NULL,
        file_size INT NULL,
        file_type VARCHAR(100) NULL,
        duration INT NULL COMMENT 'Duration in seconds for voice messages',
        thumbnail_url VARCHAR(500) NULL COMMENT 'Thumbnail for images/videos',
        status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_conversation (conversation_id),
        INDEX idx_sender (sender_id),
        INDEX idx_receiver (receiver_id),
        INDEX idx_status (status),
        INDEX idx_message_type (message_type),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Created new messages table with multimedia support');
    
    // Check if profile_picture column exists before adding
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nearo' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'profile_picture'
    `);
    
    if (columns.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) NULL AFTER email');
      console.log('✅ Added profile_picture column to users table');
    } else {
      console.log('ℹ️  profile_picture column already exists');
    }
    
    // Create file_uploads table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL,
        upload_context ENUM('message_image', 'message_voice', 'profile_picture', 'service_image') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_upload_context (upload_context),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Created file_uploads tracking table');
    
    // Check and add last_message_preview column
    const [convColumns1] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nearo' 
      AND TABLE_NAME = 'conversations' 
      AND COLUMN_NAME = 'last_message_preview'
    `);
    
    if (convColumns1.length === 0) {
      await connection.query('ALTER TABLE conversations ADD COLUMN last_message_preview TEXT NULL AFTER last_message_at');
      console.log('✅ Added last_message_preview column to conversations table');
    } else {
      console.log('ℹ️  last_message_preview column already exists');
    }
    
    // Check and add last_message_type column
    const [convColumns2] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nearo' 
      AND TABLE_NAME = 'conversations' 
      AND COLUMN_NAME = 'last_message_type'
    `);
    
    if (convColumns2.length === 0) {
      await connection.query("ALTER TABLE conversations ADD COLUMN last_message_type ENUM('text', 'image', 'voice', 'file') NULL AFTER last_message_preview");
      console.log('✅ Added last_message_type column to conversations table');
    } else {
      console.log('ℹ️  last_message_type column already exists');
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
