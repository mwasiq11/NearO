import { pool } from './database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const createAdminAndModerator = async () => {
  console.log('🔐 Creating Admin and Moderator accounts...\n');
  
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const [existing] = await pool.execute(
      'SELECT id, role FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      // Update existing user to admin role
      await pool.execute(
        'UPDATE users SET role = ?, password = ?, is_active = 1, is_verified = 1 WHERE email = ?',
        ['admin', hashedPassword, email]
      );
      console.log('✅ Updated existing user to Admin role');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: admin (has access to everything)\n`);
    } else {
      // Create new admin user
      const adminId = uuidv4();
      await pool.execute(
        `INSERT INTO users (id, name, email, password, role, city, neighborhood, is_active, is_verified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())`,
        [adminId, 'Super Admin', email, hashedPassword, 'admin', 'Karachi', 'DHA']
      );
      console.log('✅ Created new Admin account');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: admin (super user)\n`);
    }
    
    console.log('📋 Role Hierarchy:');
    console.log('   1. Admin (highest) - Can manage moderators, providers, seekers');
    console.log('   2. Moderator (middle) - Can manage providers and seekers');
    console.log('   3. User (lowest) - Can be provider or seeker\n');
    
    console.log('🔗 Login URLs:');
    console.log('   Admin: http://localhost:8080/auth/admin-login');
    console.log('   Moderator: http://localhost:8080/auth/moderator-login\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

createAdminAndModerator();
