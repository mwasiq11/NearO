import { pool } from './database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const seedDatabase = async () => {
  console.log('🌱 Starting database seed...');
  
  try {
    // Create sample users (providers and seekers)
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const users = [
      // Admin
      { id: uuidv4(), name: 'Admin User', email: process.env.ADMIN_EMAIL, role: 'admin', city: 'Karachi', neighborhood: 'DHA' },
      // Providers (they are users who provide services)
      { id: uuidv4(), name: 'Ali Hassan', email: 'ali.hassan@gmail.com', role: 'user', city: 'Karachi', neighborhood: 'Gulshan-e-Iqbal' },
      { id: uuidv4(), name: 'Sara Ahmed', email: 'sara.ahmed@gmail.com', role: 'user', city: 'Karachi', neighborhood: 'Clifton' },
      { id: uuidv4(), name: 'Usman Khan', email: 'usman.khan@gmail.com', role: 'user', city: 'Lahore', neighborhood: 'Gulberg' },
      { id: uuidv4(), name: 'Fatima Noor', email: 'fatima.noor@gmail.com', role: 'user', city: 'Lahore', neighborhood: 'DHA' },
      { id: uuidv4(), name: 'Ahmed Raza', email: 'ahmed.raza@gmail.com', role: 'user', city: 'Islamabad', neighborhood: 'F-6' },
      // Seekers
      { id: uuidv4(), name: 'Zain Ali', email: 'zain.ali@gmail.com', role: 'user', city: 'Karachi', neighborhood: 'Gulshan-e-Iqbal' },
      { id: uuidv4(), name: 'Ayesha Khan', email: 'ayesha.khan@gmail.com', role: 'user', city: 'Karachi', neighborhood: 'North Nazimabad' },
      { id: uuidv4(), name: 'Bilal Ahmed', email: 'bilal.ahmed@gmail.com', role: 'user', city: 'Lahore', neighborhood: 'Model Town' },
      { id: uuidv4(), name: 'Hira Malik', email: 'hira.malik@gmail.com', role: 'user', city: 'Islamabad', neighborhood: 'F-7' },
      // Moderator
      { id: uuidv4(), name: 'Moderator Ali', email: process.env.MODERATOR_EMAIL, role: 'moderator', city: 'Karachi', neighborhood: 'Clifton' },
    ];
    
    console.log('👥 Creating users...');
    for (const user of users) {
      try {
        await pool.execute(
          `INSERT INTO users (id, name, email, password, role, city, neighborhood, is_active, is_verified, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [user.id, user.name, user.email, hashedPassword, user.role, user.city, user.neighborhood]
        );
        console.log(`  ✅ Created user: ${user.name} (${user.role})`);
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.log(`  ⚠️ User ${user.email} skipped: ${err.message}`);
        }
      }
    }

    // Get created providers and seekers (any user can be a provider)
    const [allUsers] = await pool.execute(`SELECT id, name FROM users WHERE role = 'user' ORDER BY created_at DESC LIMIT 10`);
    const providers = allUsers.slice(0, 5);
    const seekers = allUsers.slice(5, 10);
    
    // Create service categories
    const categories = ['Plumbing', 'Electrician', 'Cleaning', 'Tutoring', 'Repair', 'Beauty', 'Photography', 'Catering'];
    console.log('\n📂 Creating service categories...');
    for (const cat of categories) {
      try {
        await pool.execute(
          `INSERT INTO service_categories (id, name, description, is_active, created_at)
           VALUES (?, ?, ?, 1, NOW())
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [uuidv4(), cat, `${cat} services in your area`]
        );
        console.log(`  ✅ Created category: ${cat}`);
      } catch (err) {
        // Skip if exists
      }
    }
    
    // Create sample services for providers
    const services = [
      { title: 'Home Plumbing Services', description: 'Professional plumbing repairs and installations', category: 'Plumbing', price: 2500, providerId: providers[0]?.id },
      { title: 'Electrical Repairs', description: 'Fixing electrical issues, wiring, installations', category: 'Electrician', price: 3000, providerId: providers[0]?.id },
      { title: 'Deep House Cleaning', description: 'Complete home cleaning service with eco-friendly products', category: 'Cleaning', price: 5000, providerId: providers[1]?.id },
      { title: 'Math & Science Tutoring', description: 'O/A Level tutoring for Math and Science subjects', category: 'Tutoring', price: 2000, providerId: providers[2]?.id },
      { title: 'Mobile Phone Repair', description: 'Screen replacement, battery issues, software problems', category: 'Repair', price: 1500, providerId: providers[2]?.id },
      { title: 'Bridal Makeup Services', description: 'Professional bridal makeup and styling', category: 'Beauty', price: 15000, providerId: providers[3]?.id },
      { title: 'Wedding Photography', description: 'Complete wedding photography package', category: 'Photography', price: 50000, providerId: providers[4]?.id },
      { title: 'Event Catering', description: 'Delicious food for your events and parties', category: 'Catering', price: 25000, providerId: providers[4]?.id },
    ];

    console.log('\n🛠️ Creating services...');
    const createdServiceIds = [];
    for (const service of services) {
      if (!service.providerId) continue;
      try {
        const serviceId = uuidv4();
        await pool.execute(
          `INSERT INTO services (id, provider_id, title, description, category, price, availability, is_active, city, neighborhood, created_at)
           VALUES (?, ?, ?, ?, ?, ?, '{"days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "hours": "9:00 AM - 6:00 PM"}', 1, 'Karachi', 'Gulshan', NOW())`,
          [serviceId, service.providerId, service.title, service.description, service.category, service.price]
        );
        createdServiceIds.push({ id: serviceId, providerId: service.providerId, title: service.title });
        console.log(`  ✅ Created service: ${service.title}`);
      } catch (err) {
        console.log(`  ⚠️ Service skipped: ${err.message}`);
      }
    }

    // Create sample bookings
    console.log('\n📅 Creating bookings...');
    if (seekers.length > 0 && createdServiceIds.length > 0) {
      const bookingStatuses = ['pending', 'approved', 'rejected', 'pending', 'approved'];
      for (let i = 0; i < Math.min(5, createdServiceIds.length); i++) {
        const seeker = seekers[i % seekers.length];
        const service = createdServiceIds[i];
        if (!seeker || !service) continue;
        
        try {
          const bookingId = uuidv4();
          const status = bookingStatuses[i % bookingStatuses.length];
          await pool.execute(
            `INSERT INTO bookings (id, service_id, seeker_id, requested_time, status, created_at)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?, NOW())`,
            [bookingId, service.id, seeker.id, i + 1, status]
          );
          console.log(`  ✅ Created booking: ${seeker.name} -> ${service.title} (${status})`);
          
          // Create notification for the booking
          await pool.execute(
            `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, is_read, created_at)
             VALUES (?, ?, ?, ?, ?, 'booking', ?, 0, NOW())`,
            [
              uuidv4(),
              service.providerId,
              'booking_new',
              'New Booking Request',
              `${seeker.name} requested to book ${service.title}`,
              bookingId
            ]
          );
          
          // If approved, notify seeker
          if (status === 'approved' || status === 'completed') {
            await pool.execute(
              `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, is_read, created_at)
               VALUES (?, ?, ?, ?, ?, 'booking', ?, 0, NOW())`,
              [
                uuidv4(),
                seeker.id,
                'booking_accepted',
                'Booking Accepted',
                `Your booking for ${service.title} has been accepted!`,
                bookingId
              ]
            );
          }
        } catch (err) {
          console.log(`  ⚠️ Booking skipped: ${err.message}`);
        }
      }
    }

    // Create sample reviews (only for approved bookings)
    console.log('\n⭐ Creating reviews...');
    // Get approved bookings to create reviews
    const [approvedBookings] = await pool.execute(`
      SELECT b.id as booking_id, b.seeker_id, s.provider_id, s.id as service_id 
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.status = 'approved' 
      LIMIT 5
    `);
    
    const reviewComments = [
      { rating: 5, comment: 'Excellent service! Very professional and punctual.' },
      { rating: 4, comment: 'Good work, would recommend to others.' },
      { rating: 5, comment: 'Amazing experience, exceeded expectations!' },
      { rating: 3, comment: 'Decent service, room for improvement.' },
      { rating: 5, comment: 'Outstanding quality and friendly service!' },
    ];
    
    for (let i = 0; i < approvedBookings.length; i++) {
      const booking = approvedBookings[i];
      const review = reviewComments[i % reviewComments.length];
      
      try {
        const reviewId = uuidv4();
        await pool.execute(
          `INSERT INTO reviews (id, provider_id, reviewer_id, service_id, booking_id, rating, comment, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [reviewId, booking.provider_id, booking.seeker_id, booking.service_id, booking.booking_id, review.rating, review.comment]
        );
        console.log(`  ✅ Created review: ${review.rating} stars - "${review.comment.substring(0, 30)}..."`);
        
        // Create notification for provider about review
        await pool.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, 'review', ?, 0, NOW())`,
          [
            uuidv4(),
            booking.provider_id,
            'review_posted',
            'New Review',
            `You received a ${review.rating}-star review!`,
            reviewId
          ]
        );
      } catch (err) {
        console.log(`  ⚠️ Review skipped: ${err.message}`);
      }
    }

    // Create sample conversations and messages
    console.log('\n💬 Creating conversations and messages...');
    if (seekers.length > 0 && providers.length > 0 && createdServiceIds.length > 0) {
      for (let i = 0; i < Math.min(3, createdServiceIds.length); i++) {
        const seeker = seekers[i % seekers.length];
        const service = createdServiceIds[i];
        if (!seeker || !service) continue;
        
        try {
          const convId = uuidv4();
          await pool.execute(
            `INSERT INTO conversations (id, seeker_id, provider_id, service_id, last_message_at, last_message_preview, created_at)
             VALUES (?, ?, ?, ?, NOW(), 'Hello, I am interested in your service', NOW())`,
            [convId, seeker.id, service.providerId, service.id]
          );
          
          // Add messages
          const messages = [
            { sender: seeker.id, receiver: service.providerId, content: 'Hello, I am interested in your service. Are you available next week?' },
            { sender: service.providerId, receiver: seeker.id, content: 'Hi! Yes, I am available. What day works best for you?' },
            { sender: seeker.id, receiver: service.providerId, content: 'How about Tuesday at 3 PM?' },
          ];
          
          for (const msg of messages) {
            await pool.execute(
              `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, message_type, status, created_at)
               VALUES (?, ?, ?, ?, ?, 'text', 'sent', NOW())`,
              [uuidv4(), convId, msg.sender, msg.receiver, msg.content]
            );
          }
          console.log(`  ✅ Created conversation between ${seeker.name} and provider`);
        } catch (err) {
          console.log(`  ⚠️ Conversation skipped: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [serviceCount] = await pool.execute('SELECT COUNT(*) as count FROM services');
    const [bookingCount] = await pool.execute('SELECT COUNT(*) as count FROM bookings');
    const [reviewCount] = await pool.execute('SELECT COUNT(*) as count FROM reviews');
    const [notifCount] = await pool.execute('SELECT COUNT(*) as count FROM notifications');
    const [convCount] = await pool.execute('SELECT COUNT(*) as count FROM conversations');
    const [msgCount] = await pool.execute('SELECT COUNT(*) as count FROM messages');
    
    console.log(`  👥 Users: ${userCount[0].count}`);
    console.log(`  🛠️ Services: ${serviceCount[0].count}`);
    console.log(`  📅 Bookings: ${bookingCount[0].count}`);
    console.log(`  ⭐ Reviews: ${reviewCount[0].count}`);
    console.log(`  🔔 Notifications: ${notifCount[0].count}`);
    console.log(`  💬 Conversations: ${convCount[0].count}`);
    console.log(`  📨 Messages: ${msgCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
};

seedDatabase();
