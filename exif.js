// exif.js
const exifr = require('exifr');

async function extractGpsFromBuffer(buffer) {
  try {
    const gps = await exifr.gps(buffer);
    if (!gps || !gps.latitude || !gps.longitude) {
      return {
        latitude: 19.27687390934362,
        longitude: -71.25109030001309,
      };
    }
    return {
      latitude: gps.latitude,
      longitude: gps.longitude,
    };
  } catch (err) {
    console.error('⚠️ Error reading EXIF GPS data:', err.message);
    return {
      latitude: 19.27687390934362,
      longitude: -71.25109030001309,
    };
  }
}

module.exports = {
  extractGpsFromBuffer,
};
