// drive.js
const { google } = require('googleapis');

async function authenticateDrive() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

async function listFolders(drive, parentId) {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  console.log(`📁 Contents of ${parentId}:`, res.data.files);
  return res.data.files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
}

async function listFiles(drive, parentId) {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files;
}

async function walkDriveFolders(auth, rootFolderId) {
  const drive = google.drive({ version: 'v3', auth });
  const photos = [];

  const customerFolders = await listFolders(drive, rootFolderId);
  console.log(`🧭 Customer folders: ${customerFolders.length}`);

  for (const customerFolder of customerFolders) {
    const customer = customerFolder.name;
    console.log(`🔹 Customer: ${customer}`);
    const projectFolders = await listFolders(drive, customerFolder.id);

    for (const projectFolder of projectFolders) {
      const project = projectFolder.name;
      console.log(`  🔸 Project: ${project}`);
      const jobFolders = await listFolders(drive, projectFolder.id);

      for (const jobFolder of jobFolders) {
        const job = jobFolder.name;
        console.log(`    🔸 Job: ${job}`);
        const categoryFolders = await listFolders(drive, jobFolder.id);

        for (const categoryFolder of categoryFolders) {
          const category = categoryFolder.name;
          console.log(`      🔸 Category: ${category}`);

          const files = await listFiles(drive, categoryFolder.id);
          const imageFiles = files.filter(f => f.mimeType && f.mimeType.startsWith('image/'));
          console.log(`        📸 Found ${imageFiles.length} photo(s)`);

          for (const file of imageFiles) {
            try {
              console.log(`⬇️ Downloading: ${file.name}`);
              const res = await drive.files.get(
                {
                  fileId: file.id,
                  alt: 'media',
                },
                { responseType: 'stream' }
              );

              const chunks = [];
              for await (const chunk of res.data) {
                chunks.push(chunk);
              }

              console.log(`✅ Download complete: ${file.name}`);
              const buffer = Buffer.concat(chunks);

              photos.push({
                id: file.id,
                filename: file.name,
                fileBuffer: buffer,
                customer,
                project,
                job,
                jobFolderId: jobFolder.id, // <-- ADD THIS
                category,
              });

              console.log(`📸 Buffered and pushed: ${file.name}`);
              console.log(`✅ Finished processing: ${file.name}`);
            } catch (err) {
              console.error(`⚠️ Failed to download ${file.name}:`, err.message);
            }
          }

          console.log(`📂 Done with category: ${category}`);
        }
      }
    }
  }

  console.log(`📦 Preparing to return ${photos.length} photo(s)`);
  return photos;
}

module.exports = {
  authenticateDrive,
  walkDriveFolders,
};
