import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = join(__dirname, 'migrations', 'add_user_profile_fields.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration: add_user_profile_fields.sql');

    // Execute migration
    await connection.query(migrationSQL);

    console.log('✅ Migration completed successfully');
    console.log('\n🎉 Users table has been updated with profile fields (phone, neighborhood, city, latitude, longitude, profile_picture)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

runMigration();
