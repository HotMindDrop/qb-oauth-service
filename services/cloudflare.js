const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file to Cloudflare R2
 * @param {string} filePath - Local path to the file
 * @param {string} originalName - Original filename
 * @returns {Promise<string>} - Cloudflare URL
 */
async function uploadToCloudflare(filePath, originalName) {
  try {
    console.log(`🔼 Uploading to Cloudflare: ${originalName}`);

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(originalName);
    const fileName = `${timestamp}-${randomSuffix}${fileExtension}`;

    // Read file stream
    const fileStream = fs.createReadStream(filePath);

    // Create upload command
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: fileName,
      Body: fileStream,
      ContentType: getMimeType(originalName),
      Metadata: {
        originalName: originalName
      }
    });

    // Upload to Cloudflare
    await s3Client.send(uploadCommand);

    // Generate public URL
    const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;
    
    console.log(`✅ Upload success: ${originalName} -> ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error(`❌ Cloudflare upload failed for ${originalName}:`, error);
    throw new Error(`Failed to upload ${originalName} to Cloudflare: ${error.message}`);
  }
}

/**
 * Get MIME type based on file extension
 * @param {string} filename - Filename
 * @returns {string} - MIME type
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
  uploadToCloudflare
}; 