import { pool } from './database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const createModerator = async () => {
  console.log('🔐 Creating Moderator Account...\n');
  
  try {
    // Create moderator account
    const modEmail = 'moderator@nearo.pk';
    const modPassword = 'Wasiq00001';
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
    
    console.log('\n📋 Moderator Credentials:');
    console.log('   Email: moderator@nearo.pk');
    console.log('   Password: Wasiq00001');
    console.log('   Role: moderator');
    
    console.log('\n📋 Admin Credentials (existing):');
    console.log('   Email: muhammadwasiq67585@gmail.com');
    console.log('   Password: Wasiq00001');
    console.log('   Role: admin');
    
    console.log('\n🔗 Login URLs:');
    console.log('   Moderator: http://localhost:8080/auth/moderator-login');
    console.log('   Admin: http://localhost:8080/auth/admin-login');
    
    console.log('\n⚠️  Important:');
    console.log('   - Each role needs a SEPARATE account');
    console.log('   - Cannot use same email for admin and moderator');
    console.log('   - Admin account: muhammadwasiq67585@gmail.com');
    console.log('   - Moderator account: moderator@nearo.pk\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

createModerator();
