import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Configure Cloudinary
console.log('☁️ Configuring Cloudinary with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '****' : 'MISSING',
  secret: process.env.CLOUDINARY_API_SECRET ? '****' : 'MISSING'
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function migrate() {
  console.log('🚀 Starting Cloudinary Migration...');

  // 1. Migrate Services
  const services = await prisma.services.findMany({
    where: { 
      image_url: { contains: '/uploads/' },
      NOT: { image_url: { contains: 'res.cloudinary.com' } }
    }
  });

  console.log(`📦 Found ${services.length} services to migrate.`);
  for (const service of services) {
    try {
      const localPath = path.join(process.cwd(), service.image_url.startsWith('http') 
        ? new URL(service.image_url).pathname 
        : service.image_url);
      
      if (fs.existsSync(localPath)) {
        console.log(`  ⬆️ Uploading service image: ${service.title}`);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: 'nearo/provider-images',
          public_id: path.basename(localPath, path.extname(localPath)),
        });

        await prisma.services.update({
          where: { id: service.id },
          data: { image_url: result.secure_url }
        });
        console.log(`  ✅ Migrated: ${service.title} -> ${result.secure_url}`);
      } else {
        console.warn(`  ⚠️ File not found: ${localPath}`);
      }
    } catch (err) {
      console.error(`  ❌ Error migrating service ${service.id}:`, err.message);
    }
  }

  // 2. Migrate Users (Profiles)
  const users = await prisma.users.findMany({
    where: { 
      profile_picture: { contains: '/uploads/' },
      NOT: { profile_picture: { contains: 'res.cloudinary.com' } }
    }
  });

  console.log(`👤 Found ${users.length} users to migrate.`);
  for (const user of users) {
    try {
      const localPath = path.join(process.cwd(), user.profile_picture.startsWith('http') 
        ? new URL(user.profile_picture).pathname 
        : user.profile_picture);
      
      if (fs.existsSync(localPath)) {
        console.log(`  ⬆️ Uploading profile picture for: ${user.name}`);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: 'nearo/profile-images',
          public_id: path.basename(localPath, path.extname(localPath)),
        });

        await prisma.users.update({
          where: { id: user.id },
          data: { profile_picture: result.secure_url }
        });
        console.log(`  ✅ Migrated: ${user.name} -> ${result.secure_url}`);
      }
    } catch (err) {
      console.error(`  ❌ Error migrating user ${user.id}:`, err.message);
    }
  }

  // 3. Migrate Messages
  const messages = await prisma.messages.findMany({
    where: { 
      file_url: { contains: '/uploads/' },
      NOT: { file_url: { contains: 'res.cloudinary.com' } }
    }
  });

  console.log(`💬 Found ${messages.length} messages to migrate.`);
  for (const msg of messages) {
    try {
      const localPath = path.join(process.cwd(), msg.file_url.startsWith('http') 
        ? new URL(msg.file_url).pathname 
        : msg.file_url);
      
      if (fs.existsSync(localPath)) {
        console.log(`  ⬆️ Uploading message attachment: ${msg.id}`);
        // Handle audio/video/raw for messages
        const resourceType = msg.message_type === 'voice' ? 'video' : 
                            msg.message_type === 'image' ? 'image' : 'raw';

        const result = await cloudinary.uploader.upload(localPath, {
          folder: 'nearo/message-content',
          resource_type: resourceType,
          public_id: path.basename(localPath, path.extname(localPath)),
        });

        await prisma.messages.update({
          where: { id: msg.id },
          data: { file_url: result.secure_url }
        });
        console.log(`  ✅ Migrated message ${msg.id} -> ${result.secure_url}`);
      }
    } catch (err) {
      console.error(`  ❌ Error migrating message ${msg.id}:`, err.message);
    }
  }

  // 4. Update file_uploads table
  const uploads = await prisma.file_uploads.findMany({
    where: { 
      file_path: { contains: 'uploads' },
      NOT: { file_path: { contains: 'res.cloudinary.com' } }
    }
  });

  console.log(`📂 Updating ${uploads.length} entries in file_uploads table.`);
  for (const upload of uploads) {
    // We try to find the matching migrated record in other tables or just update to the same cloud URL if we can find it
    // Actually, it's safer to just point it to the cloud URL if we already migrated it
    // For simplicity in this script, we'll try to find the new URL in the related table
    let newUrl = null;
    
    if (upload.upload_context === 'service_image') {
       const s = await prisma.services.findFirst({ where: { image_url: { contains: upload.file_name } } });
       newUrl = s?.image_url;
    } else if (upload.upload_context === 'profile_picture') {
       const u = await prisma.users.findFirst({ where: { profile_picture: { contains: upload.file_name } } });
       newUrl = u?.profile_picture;
    } else {
       const m = await prisma.messages.findFirst({ where: { file_url: { contains: upload.file_name } } });
       newUrl = m?.file_url;
    }

    if (newUrl && newUrl.includes('cloudinary')) {
      await prisma.file_uploads.update({
        where: { id: upload.id },
        data: { file_path: newUrl }
      });
      console.log(`  ✅ Updated file_uploads entry: ${upload.file_name}`);
    }
  }

  console.log('🏁 Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('💥 Fatal error during migration:', err);
  process.exit(1);
});
