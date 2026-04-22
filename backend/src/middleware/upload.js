import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper to determine the folder based on context
const getCloudinaryFolder = (req, file) => {
  const context = req.body?.upload_context || req.query?.upload_context || 'messages';
  
  if (context === 'profile_picture') {
    return 'nearo/profile-images';
  } else if (context === 'service_image') {
    return 'nearo/provider-images';
  }
  return 'nearo/message-content';
};

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folder = getCloudinaryFolder(req, file);
    const format = path.extname(file.originalname).substring(1) || 'png';
    const publicId = `${uuidv4()}`;

    // Cloudinary supports different resource types (image, video, raw)
    // Multer-storage-cloudinary usually defaults to 'image'
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 
                        file.mimetype.startsWith('audio/') ? 'video' : // Cloudinary treats audio as video resource type
                        file.mimetype.startsWith('image/') ? 'image' : 'raw';

    return {
      folder: folder,
      format: format,
      public_id: publicId,
      resource_type: resourceType,
      access_mode: 'public'
    };
  }
});

// File filter (keeping existing restrictions)
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed'
    ]
  };

  const allAllowedTypes = [...allowedTypes.image, ...allowedTypes.audio, ...allowedTypes.document];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Export the same API for controllers
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 5);

// Memory storage version (if needed as fallback)
const memoryStorage = multer.memoryStorage();
export const uploadMemory = multer({ storage: memoryStorage, fileFilter });
export const uploadSingleToMemory = uploadMemory.single('file');

/**
 * Get file type category from mimetype
 */
export const getFileCategory = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('audio/')) return 'voice';
  return 'file';
};

/**
 * Get public URL for uploaded file
 * In Cloudinary, the URL is stored in file.path by multer-storage-cloudinary
 */
export const getFileUrl = (filename, context = 'messages', fileData = null) => {
  // If we have the direct path from Cloudinary, use it
  if (fileData && fileData.path) {
    return fileData.path;
  }
  
  // Minimal fallback for local files (handles existing records)
  if (filename && filename.startsWith('http')) {
    return filename;
  }
  
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  const folder = context === 'profile_picture' ? 'profiles' : context === 'service_image' ? 'services' : 'messages';
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

/**
 * Delete file from Cloudinary
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting Cloudinary asset:', error);
    return false;
  }
};

export default upload;
