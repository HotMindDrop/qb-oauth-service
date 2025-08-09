// uploadR2.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadToR2(filename, filePath) {
  console.log(`🔼 Uploading to R2: ${filename}`);

  const fileStream = fs.createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: fileStream,
    ContentType: getMimeType(filename),
  });

  try {
    const result = await s3.send(command);
    console.log(`✅ Upload success: ${filename}`);
    return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${filename}`;
  } catch (err) {
    console.error(`❌ Upload failed: ${filename}`, err.message);
    throw err; // Let the main script catch and count this as a failed upload
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

module.exports = {
  uploadToR2,
};
