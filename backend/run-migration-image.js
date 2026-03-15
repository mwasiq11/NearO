import { pool } from './src/db/database.js';

async function runMigration() {
  try {
    await pool.execute('ALTER TABLE services ADD COLUMN image_url VARCHAR(255) NULL;');
    console.log('✅ Migration applied successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Migration error:', error);
    }
  } finally {
    process.exit(0);
  }
}

runMigration();
