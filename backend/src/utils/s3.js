import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

// Ensure required environment variables are present
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;

if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
  console.warn('⚠️ AWS S3 credentials are not fully configured in .env. Image uploads to S3 will fail.');
}

const s3Client = new S3Client({
  region: region || 'us-east-1',
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || ''
  }
});

/**
 * Uploads a file buffer to S3
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type of the file
 * @param {string} folder - Folder prefix (e.g., 'services')
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadToS3 = async (fileBuffer, originalName, mimeType, folder = 'uploads') => {
  try {
    const ext = path.extname(originalName);
    const fileName = `${folder}/${uuidv4()}${ext}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
      // Optional: Set ACL if your bucket allows public read by default
      // ACL: 'public-read' 
    });

    await s3Client.send(command);

    // Return the public S3 URL
    return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload image to S3: ${error.message}`);
  }
};
