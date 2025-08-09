// list-shared-drives.js
require('dotenv').config();
const { google } = require('googleapis');

(async () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,buffered
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const res = await drive.drives.list({ fields: 'drives(id,name)' });
    console.log('\n📂 Shared Drives:\n');
    res.data.drives.forEach((d) => {
      console.log(`- ${d.name} (ID: ${d.id})`);
    });
  } catch (err) {
    console.error('❌ Error listing shared drives:', err.message);
  }
})();
