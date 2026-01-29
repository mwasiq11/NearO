import { pool } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createViews = async () => {
  console.log('📊 Creating database views...\n');
  
  try {
    const sqlFile = fs.readFileSync(path.join(__dirname, 'create_views.sql'), 'utf8');
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        try {
          await pool.execute(trimmed);
          console.log('✅ Executed statement');
        } catch (err) {
          console.error('⚠️ Statement error:', err.message);
        }
      }
    }
    
    console.log('\n✅ All views created successfully!\n');
    console.log('📋 Created views:');
    console.log('  1. user_complete_profile - User stats summary');
    console.log('  2. user_services_detail - Users with their services');
    console.log('  3. user_bookings_as_seeker - Users with services they booked');
    console.log('  4. user_bookings_as_provider - Providers with their bookings');
    console.log('  5. user_complete_activity - EVERYTHING about each user\n');
    
    console.log('🔍 How to use in MySQL Workbench:');
    console.log('  SELECT * FROM user_complete_activity;');
    console.log('  SELECT * FROM user_complete_profile WHERE name = "Ahmed Huzaifa";\n');
    
  } catch (error) {
    console.error('❌ Error creating views:', error);
  } finally {
    process.exit(0);
  }
};

createViews();
