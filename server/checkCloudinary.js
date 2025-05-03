// Simple script to check if the Cloudinary images exist
import https from 'https';

// List of image IDs to check
const imageIds = [
  'fae075af-fc0e-481c-8512-a972f44425b6-removebg-preview.png',
  '10f5e9d3-8a86-4858-8ad1-5859e7e98e89-removebg-preview.png',
  '8e75a215-9279-4c1f-8c70-c51150da25a5-removebg-preview.png',
  'ac4187c6-a203-4f78-852d-d28399fba46d-removebg-preview.png',
  'acf70a16-0bc1-4fff-ab1f-8d93de00e191-removebg-preview.png',
  'ea4e5741-0311-4042-94b0-5d295542c844-removebg-preview.png'
];

// Cloudinary cloud name
const cloudName = 'dmwypgggc'; 

// Function to check if an image exists
function checkImageExists(url) {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      const statusCode = response.statusCode;
      console.log(`Image URL: ${url}`);
      console.log(`Status code: ${statusCode}`);
      resolve(statusCode === 200);
    }).on('error', (err) => {
      console.error(`Error checking image: ${err.message}`);
      resolve(false);
    });
  });
}

// Main function
async function checkAllImages() {
  console.log('Checking Cloudinary images...');
  
  let existingCount = 0;
  let missingCount = 0;
  
  for (const imageId of imageIds) {
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/v1714912548/sipofeden/${imageId}`;
    const exists = await checkImageExists(url);
    
    if (exists) {
      console.log(`✅ Image exists: ${imageId}`);
      existingCount++;
    } else {
      console.log(`❌ Image missing: ${imageId}`);
      missingCount++;
    }
    console.log('-------------------');
  }
  
  console.log('\nSummary:');
  console.log(`Total images checked: ${imageIds.length}`);
  console.log(`Existing images: ${existingCount}`);
  console.log(`Missing images: ${missingCount}`);
  
  if (missingCount > 0) {
    console.log('\n⚠️ Some images are missing from Cloudinary!');
    console.log('You need to upload these images to Cloudinary at folder "sipofeden"');
    console.log('Or update the image URLs in initializeDb.ts to use different images');
  } else {
    console.log('\n✅ All images exist in Cloudinary!');
  }
}

// Run the check
checkAllImages(); 