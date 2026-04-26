import prisma from './src/db/prisma.js';

async function test() {
  try {
    const userCount = await prisma.users.count();
    console.log('User count:', userCount);
    
    // Test finding a user by email
    const testEmail = 'test@example.com';
    const user = await prisma.users.findUnique({
      where: { email: testEmail }
    });
    console.log('User found:', user ? 'Yes' : 'No');
    
    process.exit(0);
  } catch (error) {
    console.error('Prisma test failed:', error);
    process.exit(1);
  }
}

test();
