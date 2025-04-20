import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';

// Initialize Cloudinary with direct configuration
cloudinary.config({
  cloud_name: 'dmwypgggc',
  api_key: '781269855996276',
  api_secret: '1nhaVSQQUc-aMi7ayhLJS75DiJw'
});

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
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer to upload
 * @param folder - Optional folder path in Cloudinary
 * @returns Promise with Cloudinary upload result
 */
export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string = 'juice-products'
): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Failed to upload to Cloudinary'));
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    // Convert buffer to stream and pipe to uploadStream
    const Readable = require('stream').Readable;
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Delete an image from Cloudinary by its public ID
 * @param publicId - Cloudinary public ID of the image to delete
 * @returns Promise with Cloudinary deletion result
 */
export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  return await cloudinary.uploader.destroy(publicId);
};