import { pool } from './database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const createModerator = async () => {
  console.log('🔐 Creating Moderator Account...\n');
  
  try {
    // Create moderator account
    const modEmail = process.env.MODERATOR_EMAIL;
    const modPassword = process.env.MODERATOR_PASSWORD;
    const hashedPassword = await bcrypt.hash(modPassword, 10);
    
    // Check if moderator already exists
    const [existing] = await pool.execute(
      'SELECT id, role FROM users WHERE email = ?',
      [modEmail]
    );
    
    if (existing.length > 0) {
      // Update to moderator role
      await pool.execute(
        'UPDATE users SET role = ?, password = ?, is_active = 1, is_verified = 1 WHERE email = ?',
        ['moderator', hashedPassword, modEmail]
      );
      console.log('✅ Updated existing user to Moderator role');
    } else {
      // Create new moderator
      const modId = uuidv4();
      await pool.execute(
        `INSERT INTO users (id, name, email, password, role, city, neighborhood, is_active, is_verified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())`,
        [modId, 'Moderator User', modEmail, hashedPassword, 'moderator', 'Karachi', 'Clifton']
      );
      console.log('✅ Created new Moderator account');
    }
    

    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

createModerator();
