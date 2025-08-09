const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('🔥 Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

/**
 * Create the files table if it doesn't exist
 */
async function initializeDatabase() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        cloudflare_url TEXT NOT NULL,
        category VARCHAR(10) NOT NULL CHECK (category IN ('A', 'B', 'C')),
        file_size BIGINT,
        mime_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Database table initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Insert a file record into the database
 * @param {Object} fileData - File data object
 * @param {string} fileData.filename - Original filename
 * @param {string} fileData.cloudflareUrl - Cloudflare URL
 * @param {string} fileData.category - File category (A, B, or C)
 * @param {number} fileData.fileSize - File size in bytes
 * @param {string} fileData.mimeType - MIME type
 * @returns {Promise<Object>} - Inserted record with ID
 */
async function insertFileRecord(fileData) {
  const query = `
    INSERT INTO uploaded_files (
      filename,
      cloudflare_url,
      category,
      file_size,
      mime_type
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, filename, cloudflare_url, category, file_size, mime_type, created_at
  `;

  const values = [
    fileData.filename,
    fileData.cloudflareUrl,
    fileData.category,
    fileData.fileSize,
    fileData.mimeType
  ];

  try {
    const result = await pool.query(query, values);
    console.log(`✅ File record inserted: ${fileData.filename}`);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Database insert failed for ${fileData.filename}:`, error.message);
    throw new Error(`Failed to insert file record: ${error.message}`);
  }
}

/**
 * Get all uploaded files from the database
 * @returns {Promise<Array>} - Array of file records
 */
async function getFiles() {
  try {
    const query = `
      SELECT 
        id,
        filename,
        cloudflare_url,
        category,
        file_size,
        mime_type,
        created_at,
        updated_at
      FROM uploaded_files
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching files:', error);
    throw new Error(`Failed to fetch files: ${error.message}`);
  }
}

/**
 * Get files by category
 * @param {string} category - Category to filter by (A, B, or C)
 * @returns {Promise<Array>} - Array of file records
 */
async function getFilesByCategory(category) {
  try {
    const query = `
      SELECT 
        id,
        filename,
        cloudflare_url,
        category,
        file_size,
        mime_type,
        created_at,
        updated_at
      FROM uploaded_files
      WHERE category = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [category]);
    return result.rows;
  } catch (error) {
    console.error(`❌ Error fetching files for category ${category}:`, error);
    throw new Error(`Failed to fetch files for category ${category}: ${error.message}`);
  }
}

/**
 * Update file category
 * @param {number} fileId - File ID
 * @param {string} newCategory - New category (A, B, or C)
 * @returns {Promise<Object>} - Updated file record
 */
async function updateFileCategory(fileId, newCategory) {
  try {
    const query = `
      UPDATE uploaded_files
      SET category = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, filename, cloudflare_url, category, updated_at
    `;
    
    const result = await pool.query(query, [newCategory, fileId]);
    
    if (result.rows.length === 0) {
      throw new Error(`File with ID ${fileId} not found`);
    }
    
    console.log(`✅ File category updated: ID ${fileId} -> ${newCategory}`);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Error updating file category:`, error);
    throw new Error(`Failed to update file category: ${error.message}`);
  }
}

/**
 * Delete a file record
 * @param {number} fileId - File ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteFileRecord(fileId) {
  try {
    const query = `
      DELETE FROM uploaded_files
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [fileId]);
    
    if (result.rows.length === 0) {
      throw new Error(`File with ID ${fileId} not found`);
    }
    
    console.log(`✅ File record deleted: ID ${fileId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting file record:`, error);
    throw new Error(`Failed to delete file record: ${error.message}`);
  }
}

module.exports = {
  pool,
  initializeDatabase,
  insertFileRecord,
  getFiles,
  getFilesByCategory,
  updateFileCategory,
  deleteFileRecord
}; 