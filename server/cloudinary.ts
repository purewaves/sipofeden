import multer from 'multer';
import { Request } from 'express';

// Configuration moved to upload function for reliability without requiring Cloudinary

// Configure memory storage for multer (files stored in memory before upload to Cloudinary)
const storage = multer.memoryStorage();

// Configure multer for file uploads
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
 * Simple function to convert a buffer to a base64 data URL
 * @param buffer - Image buffer
 * @param mimeType - Image MIME type (e.g., image/jpeg)
 * @returns Base64 data URL for the image
 */
export const bufferToDataUrl = (buffer: Buffer, mimeType: string): string => {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
};