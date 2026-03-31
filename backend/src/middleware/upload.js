import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const messagesDir = path.join(uploadsDir, 'messages');
const profilesDir = path.join(uploadsDir, 'profiles');
const servicesDir = path.join(uploadsDir, 'services');

[uploadsDir, messagesDir, profilesDir, servicesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const context = req.body?.upload_context || req.query?.upload_context || 'messages';
    let targetDir = messagesDir;

    if (context === 'profile_picture') {
      targetDir = profilesDir;
    } else if (context === 'service_image') {
      targetDir = servicesDir;
    }

    console.log('📁 Upload destination:', { context, targetDir });
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
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

/**
 * Middleware to handle single file upload (memory storage for S3)
 */
const memoryStorage = multer.memoryStorage();
export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const uploadSingleToMemory = uploadMemory.single('file');

/**
 * Middleware to handle single file upload (disk storage)
 */
export const uploadSingle = upload.single('file');

/**
 * Middleware to handle multiple file uploads
 */
export const uploadMultiple = upload.array('files', 5);

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
 */
export const getFileUrl = (filename, context = 'messages') => {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  const folder = context === 'profile_picture' ? 'profiles' : context === 'service_image' ? 'services' : 'messages';
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

/**
 * Delete file from filesystem
 */
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
};

export default upload;
