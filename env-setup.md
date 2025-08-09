# Environment Variables Setup Guide

This guide will help you set up all the required environment variables for the File Upload API Service.

## 📋 Required Environment Variables

### 1. Server Configuration
```env
PORT=3000
NODE_ENV=development
```

### 2. Database Configuration (PostgreSQL)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/file_upload_db
```

### 3. Cloudflare R2 Configuration
```env
CLOUDFLARE_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_BUCKET_NAME=your_bucket_name
CLOUDFLARE_PUBLIC_URL=https://your-public-domain.com
```

## 🔧 Local Development Setup

### Step 1: Create .env File
Create a `.env` file in your project root directory:

```bash
# Create .env file
touch .env
```

### Step 2: Add Environment Variables
Add the following to your `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/file_upload_db

# Cloudflare R2 Configuration
CLOUDFLARE_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_BUCKET_NAME=your_bucket_name
CLOUDFLARE_PUBLIC_URL=https://your-public-domain.com
```

## ☁️ Render Deployment Setup

### Step 1: Access Render Dashboard
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your web service

### Step 2: Add Environment Variables
In your Render service dashboard:

1. Go to **Environment** tab
2. Click **Add Environment Variable** for each variable:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Server port (Render requirement) |
| `DATABASE_URL` | `[From Database]` | PostgreSQL connection string |
| `CLOUDFLARE_ENDPOINT` | `https://your-account-id.r2.cloudflarestorage.com` | Cloudflare R2 endpoint |
| `CLOUDFLARE_ACCESS_KEY_ID` | `your_access_key_id` | Cloudflare access key |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | `your_secret_access_key` | Cloudflare secret key |
| `CLOUDFLARE_BUCKET_NAME` | `your_bucket_name` | R2 bucket name |
| `CLOUDFLARE_PUBLIC_URL` | `https://your-public-domain.com` | Public domain for files |

## 🗄️ Database Setup

### Local PostgreSQL
```bash
# Install PostgreSQL (if not already installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib
# Windows: Download from https://www.postgresql.org/download/windows/

# Create database
createdb file_upload_db

# Or using psql
psql -U postgres
CREATE DATABASE file_upload_db;
```

### Render PostgreSQL
1. In Render dashboard, create a new **PostgreSQL** database
2. Copy the connection string from the database settings
3. Add it as `DATABASE_URL` environment variable

## ☁️ Cloudflare R2 Setup

### Step 1: Create R2 Bucket
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Enter bucket name (e.g., `file-upload-bucket`)
5. Choose region

### Step 2: Generate API Tokens
1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use **Custom token** template
4. Add these permissions:
   - **Object Read & Write** for your bucket
   - **Bucket Read & Write** for your bucket
5. Save the token and note the credentials

### Step 3: Configure Public Access
1. In your R2 bucket settings
2. Go to **Settings** → **Public Access**
3. Enable **Public Access**
4. Add your custom domain (optional)

### Step 4: Get Endpoint URL
Your endpoint URL format:
```
https://[ACCOUNT_ID].r2.cloudflarestorage.com
```

Find your Account ID in the Cloudflare dashboard sidebar.

## 🔍 How to Find Your Values

### Cloudflare Account ID
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Look at the sidebar - your Account ID is displayed there
3. Or go to **My Profile** → **Account Home**

### Cloudflare R2 Endpoint
```
https://[YOUR_ACCOUNT_ID].r2.cloudflarestorage.com
```

### Public URL Format
If using custom domain:
```
https://your-domain.com
```

If using Cloudflare's default domain:
```
https://pub-[HASH].r2.dev
```

## ✅ Verification Steps

### 1. Test Database Connection
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"
```

### 2. Test Cloudflare Connection
```bash
# Test with curl (replace with your values)
curl -H "Authorization: AWS4-HMAC-SHA256 Credential=YOUR_ACCESS_KEY/20240101/auto/s3/aws4_request" \
     https://your-account-id.r2.cloudflarestorage.com/your-bucket-name
```

### 3. Test Application
```bash
# Start the application
npm start

# Check health endpoint
curl http://localhost:3000/api/health
```

## 🚨 Security Notes

1. **Never commit .env files** - They're already in .gitignore
2. **Use strong passwords** for database
3. **Rotate API keys** regularly
4. **Use environment-specific values** (dev vs prod)
5. **Limit API token permissions** to minimum required

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Verify PostgreSQL is running
   - Check credentials

2. **Cloudflare Upload Fails**
   - Verify endpoint URL format
   - Check API token permissions
   - Ensure bucket exists and is accessible

3. **Environment Variables Not Loading**
   - Restart application after adding variables
   - Check variable names (case-sensitive)
   - Verify .env file location

### Debug Commands
```bash
# Check environment variables
node -e "console.log(process.env)"

# Test database connection
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()').then(console.log).catch(console.error)"
```

## 📝 Example .env File

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://file_upload_user:secure_password@localhost:5432/file_upload_db

# Cloudflare R2 Configuration
CLOUDFLARE_ENDPOINT=https://1234567890abcdef.r2.cloudflarestorage.com
CLOUDFLARE_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
CLOUDFLARE_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
CLOUDFLARE_BUCKET_NAME=my-file-upload-bucket
CLOUDFLARE_PUBLIC_URL=https://files.mydomain.com
```

## 🚀 Next Steps

1. **Set up local environment** using the .env file
2. **Test locally** with `npm run dev`
3. **Deploy to Render** with production environment variables
4. **Monitor logs** for any issues
5. **Test upload functionality** with sample files

Remember to replace all placeholder values with your actual credentials! 