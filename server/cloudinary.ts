import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
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