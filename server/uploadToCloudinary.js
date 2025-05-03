// Upload images from public/assets to Cloudinary
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
config();

// Get directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary with the URL from .env
const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (!cloudinaryUrl) {
  console.error('❌ CLOUDINARY_URL not found in .env file');
  process.exit(1);
}

console.log('✅ Cloudinary URL found in .env');

// Parse the Cloudinary URL - format: cloudinary://api_key:api_secret@cloud_name
try {
  const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (!match) {
    throw new Error('Invalid CLOUDINARY_URL format');
  }
  
  const [_, api_key, api_secret, cloud_name] = match;
  
  // Configure Cloudinary with parsed values
  cloudinary.config({
    cloud_name,
    api_key,
    api_secret
  });
  
  console.log('✅ Cloudinary configuration set up');
  console.log(`   Cloud name: ${cloud_name}`);
} catch (error) {
  console.error(`❌ Error parsing CLOUDINARY_URL: ${error.message}`);
  process.exit(1);
}

// Source directory with images
const sourceDir = path.join(__dirname, '..', 'public', 'assets');

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error(`❌ Source directory not found: ${sourceDir}`);
  process.exit(1);
}

console.log(`✅ Source directory found: ${sourceDir}`);

// Get list of image files
const imageFiles = fs.readdirSync(sourceDir)
  .filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file));

if (imageFiles.length === 0) {
  console.error('❌ No image files found in source directory');
  process.exit(1);
}

console.log(`✅ Found ${imageFiles.length} image files`);

// Upload each image to Cloudinary
async function uploadImages() {
  console.log('Starting uploads to Cloudinary...\n');
  
  for (const file of imageFiles) {
    const filePath = path.join(sourceDir, file);
    try {
      console.log(`Uploading: ${file}...`);
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        public_id: path.parse(file).name, // Use filename without extension
        folder: 'sipofeden',              // Upload to this folder
        overwrite: true                   // Overwrite if exists
      });
      
      console.log(`✅ Uploaded successfully: ${file}`);
      console.log(`   URL: ${result.secure_url}`);
      console.log('-------------------');
    } catch (error) {
      console.error(`❌ Error uploading ${file}:`);
      console.error(`   ${error.message}`);
      console.log('-------------------');
    }
  }
  
  console.log('\nUpload process completed!');
}

// Run the upload
uploadImages()
  .then(() => console.log('All done!'))
  .catch(err => console.error('Error in upload process:', err)); 