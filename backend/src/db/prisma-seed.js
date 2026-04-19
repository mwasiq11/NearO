import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma database seed...');

  try {
    const adminPassword = process.env.ADMIN_PASSWORD ;
    const moderatorPassword = process.env.MODERATOR_PASSWORD ;
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD ;
    
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    const hashedModeratorPassword = await bcrypt.hash(moderatorPassword, 10);
    const hashedDefaultPassword = await bcrypt.hash(defaultPassword, 10);
    
    const adminEmail = process.env.ADMIN_EMAIL ;
    const moderatorEmail = process.env.MODERATOR_EMAIL ;

    // 1. Create Users (admin & moderator get their own passwords)
    const usersData = [
      { id: uuidv4(), name: 'Admin User', email: adminEmail, role: 'admin', city: 'Karachi', neighborhood: 'DHA', is_verified: true, password: hashedAdminPassword },
      { id: uuidv4(), name: 'Moderator Ali', email: moderatorEmail, role: 'moderator', city: 'Karachi', neighborhood: 'Clifton', is_verified: true, password: hashedModeratorPassword },
    ];

    console.log('👥 Seeding users...');
    for (const u of usersData) {
      const { password, ...userData } = u;
      await prisma.users.upsert({
        where: { email: u.email },
        update: { password },  // Always update password on re-seed
        create: {
          ...userData,
          password,
        },
      });
    }

    // 2. Create Categories
    const categories = ['Plumbing', 'Electrician', 'Cleaning', 'Tutoring', 'Repair', 'Beauty', 'Photography', 'Catering'];
    console.log('📂 Seeding categories...');
    for (const cat of categories) {
      await prisma.service_categories.upsert({
        where: { name: cat },
        update: {},
        create: {
          id: uuidv4(),
          name: cat,
          description: `${cat} services in your area`,
          is_active: true,
        },
      });
    }

    // Service seeding removed as requested (raw data cleanup)

    console.log('✅ Seeding completed!');
  } catch (e) {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
