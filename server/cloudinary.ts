import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary using URL from environment variable
if (!process.env.CLOUDINARY_URL) {
  console.error('CLOUDINARY_URL is not set in environment variables');
  process.exit(1);
}

// The cloudinary.config() call is not needed when using CLOUDINARY_URL
// cloudinary will automatically pick it up from the environment

// Configure memory storage for multer (files stored in memory before upload to Cloudinary)
const storage = multer.memoryStorage();

// Configure multer for file uploads
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit - to accommodate iPhone photos
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * Uploads a file to Cloudinary
 * @param buffer - File buffer
 * @param folder - Cloudinary folder to upload to
 * @returns Promise with the upload result
 */
export const uploadToCloudinary = async (buffer: Buffer, folder: string = 'sipofeden') => {
  try {
    console.log('Uploading file to Cloudinary...');
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder,
          resource_type: 'auto',
          quality: 'auto:good', // Automatically optimize quality
          fetch_format: 'auto', // Automatically choose best format
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('File uploaded successfully to Cloudinary');
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Simple function to convert a buffer to a base64 data URL
 * @param buffer - Image buffer
 * @param mimeType - Image MIME type (e.g., image/jpeg)
 * @returns Base64 data URL for the image
 */
export const bufferToDataUrl = (buffer: Buffer, mimeType: string): string => {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
};