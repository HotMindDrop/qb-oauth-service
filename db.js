// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('🔥 Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

// db.js
async function insertPhotoRecord({
  googleFileId,
  customer,
  project,
  job,
  category,
  creator,
  filename,
  cloudflareLink,
  lat1,
  lon1,
  googleJobFolderId,
}) {
  const query = `
    INSERT INTO migratedphotos (
      google_file_id,
      customer,
      project,
      job,
      category,
      creator,
      filename,
      cloudflare_link,
      lat1,
      lon1,
      googlejobfolderid
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING id
  `;

  const values = [
    googleFileId,
    customer,
    project,
    job,
    category,
    creator,
    filename,
    cloudflareLink,
    lat1,
    lon1,
    googleJobFolderId,
  ];

  try {
    const res = await pool.query(query, values);
    return res.rows[0].id;
  } catch (err) {
    console.error(`❌ DB insert failed for ${filename}:`, err.message);
    throw err; // <--- MAKE SURE YOU KEEP THIS
  }
}


module.exports = {
  pool,
  insertPhotoRecord,
};
