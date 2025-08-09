require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const { google } = require('googleapis');
const exifr = require('exifr');
const { Pool } = require('pg');
const mime = require('mime-types');
const { uploadToR2 } = require('./uploadR2');
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const pLimit = require('p-limit');

const DRY_RUN = process.env.DRY_RUN === 'true';
const TEMP_DIR = path.join(os.tmpdir(), 'photo_sync_temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

async function listFilesInFolder(folderId) {
  const files = [];
  let pageToken = null;
  let page = 1;

  console.log(`📂 Listing files for folder ID: ${folderId}`);

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'drive',
      driveId: process.env.SHARED_DRIVE_ID,
      pageSize: 1000,
      pageToken,
    });
    console.log(`   📄 Page ${page++}: Fetched ${res.data.files.length} items`);
    files.push(...res.data.files);
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return files;
}

async function walkDrive(folderId, pathParts = []) {
  const files = await listFilesInFolder(folderId);
  const currentPath = pathParts.join(' / ') || '[root]';
  console.log(`🔎 Scanning folder: ${currentPath} (${files.length} items)`); // 👈 Add this

  const result = [];
  for (const file of files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      console.log(`📁 Entering folder: ${[...pathParts, file.name].join(' / ')}`);
      const nested = await walkDrive(file.id, [...pathParts, file.name]);
      result.push(...nested);
    } else if (/\.(jpe?g|heic)$/i.test(file.name)) {
      const item = {
        fileId: file.id,
        filename: file.name,
        fullPath: [...pathParts, file.name],
        folderPath: pathParts,
      };
      console.log(`📂 Found photo: ${item.fullPath.join(' / ')}`);
      result.push(item);
    }
  }
  return result;
}

async function downloadPhoto(fileId, filename) {
  const destPath = path.join(TEMP_DIR, `${fileId}_${filename}`);
  const dest = fs.createWriteStream(destPath);
  const res = await drive.files.get({
    fileId,
    alt: 'media',
    supportsAllDrives: true,
  }, { responseType: 'stream' });
  await new Promise((resolve, reject) => {
    res.data.pipe(dest);
    res.data.on('end', resolve);
    res.data.on('error', reject);
  });
  return destPath;
}

async function fileExistsInR2(filename) {
  if (!filename) {
    console.warn('⚠️ fileExistsInR2 called with empty filename');
    return false;
  }
  try {
    await s3.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
    }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error(`❌ Error checking file in R2: ${filename}`, err);
    throw err;
  }
}

async function fileExistsInDB(filename) {
  const res = await pool.query('SELECT 1 FROM migratedphotos WHERE filename = $1 LIMIT 1', [filename]);
  return res.rowCount > 0;
}

async function insertPhotos(photos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const p of photos) {
      await client.query(`
        INSERT INTO migratedphotos 
        (creator, address, timestamp, r2_key, created_at, google_file_id, 
         customer, project, job, category, filename, cloudflare_link, lat1, lon1, googlejobfolderid) 
        VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [null, null, p.timestamp, p.r2_key, p.fileId, p.customer, p.project, p.job, p.category,
         p.filename, p.cloudflare_link, p.lat, p.lon, p.googlejobfolderid]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('DB Error:', e);
  } finally {
    client.release();
  }
}

(async () => {
  console.log('🚀 Starting Google Drive photo sync...');
  const photoFiles = await walkDrive(process.env.ROOT_FOLDER_ID);
  console.log(`🔍 Total photos found: ${photoFiles.length}`);

  const jobMap = new Map();
  for (const file of photoFiles) {
    const [customer, project, job, category] = file.folderPath;
    if (!customer || !project || !job || !category) continue;
    if (!file.filename) {
      console.warn(`⚠️ Skipping file with missing name:`, file);
      continue;
    }

    const alreadyInR2 = await fileExistsInR2(file.filename);
    const alreadyInDB = await fileExistsInDB(file.filename);
    if (alreadyInR2 || alreadyInDB) {
      console.log(`⏩ Skipping existing file: ${file.filename}`);
      continue;
    }

    console.log(`⬇️ Downloading: ${file.filename}`);
    const tempPath = await downloadPhoto(file.fileId, file.filename);
    let exif;
    try {
      exif = await exifr.parse(tempPath, { gps: true });
    } catch (err) {
      console.warn(`⚠️ EXIF parse failed for ${file.filename}:`, err.message);
    }

    const metadata = {
      customer,
      project,
      job,
      category,
      filename: file.filename,
      fileId: file.fileId,
      lat: exif?.latitude || null,
      lon: exif?.longitude || null,
      timestamp: exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate || null,
      googlejobfolderid: file.folderPath.slice(0, 3).join('-'),
      tempPath,
    };

    if (!jobMap.has(job)) jobMap.set(job, []);
    jobMap.get(job).push(metadata);
  }

  for (const [job, photos] of jobMap.entries()) {
    console.log(`🚧 Uploading and inserting photos for job: ${job}`);
    const limit = pLimit(5);
    const uploads = await Promise.all(
      photos.map(photo =>
        limit(async () => {
          if (!DRY_RUN) {
            try {
              const r2Url = await uploadToR2(photo.filename, photo.tempPath);
              photo.r2_key = photo.filename;
              photo.cloudflare_link = r2Url;
              console.log(`✅ Uploaded: ${photo.filename}`);
            } catch (err) {
              console.error(`❌ Failed to upload ${photo.filename}:`, err.message);
              return null;
            }
          } else {
            console.log(`[Dry Run] Would upload: ${photo.filename}`);
            photo.r2_key = 'dry-run-key';
            photo.cloudflare_link = 'https://example.com/dry-run.jpg';
          }
          return photo;
        })
      )
    );

    const successfulUploads = uploads.filter(p => p !== null);

    if (!DRY_RUN && successfulUploads.length > 0) {
      await insertPhotos(successfulUploads);
      console.log(`📥 Inserted ${successfulUploads.length} photos into DB for job: ${job}`);
    } else {
      console.log(`[Dry Run] Would insert ${successfulUploads.length} photos for job: ${job}`);
    }
  }

  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log('✅ Photo sync complete.');
})();