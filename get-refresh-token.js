const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob' // Required for Desktop App
);

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('\n👉 Visit this URL in your browser:\n');
console.log(authUrl);

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question('\n🔑 Paste the code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ Your new refresh token:\n');
    console.log(tokens.refresh_token);
  } catch (err) {
    console.error('❌ Error retrieving access token', err);
  }
  readline.close();
});
    