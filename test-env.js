#!/usr/bin/env node

/**
 * Environment Variables Test Script
 * 
 * This script tests all required environment variables for the File Upload API Service.
 * Run this before starting the application to ensure everything is configured correctly.
 */

require('dotenv').config();

console.log('🔍 Testing Environment Variables...\n');

// Required environment variables
const requiredVars = {
  // Server Configuration
  'PORT': 'Server port (default: 3000)',
  'NODE_ENV': 'Environment mode (development/production)',
  
  // Database Configuration
  'DATABASE_URL': 'PostgreSQL connection string',
  
  // Cloudflare R2 Configuration
  'CLOUDFLARE_ENDPOINT': 'Cloudflare R2 endpoint URL',
  'CLOUDFLARE_ACCESS_KEY_ID': 'Cloudflare access key ID',
  'CLOUDFLARE_SECRET_ACCESS_KEY': 'Cloudflare secret access key',
  'CLOUDFLARE_BUCKET_NAME': 'R2 bucket name',
  'CLOUDFLARE_PUBLIC_URL': 'Public domain for files'
};

let allGood = true;
const results = {};

// Test each required variable
for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: MISSING - ${description}`);
    allGood = false;
    results[varName] = 'MISSING';
  } else {
    // Mask sensitive values
    let displayValue = value;
    if (varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD')) {
      displayValue = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    }
    
    console.log(`✅ ${varName}: ${displayValue}`);
    results[varName] = 'OK';
  }
}

console.log('\n📊 Summary:');
console.log('─'.repeat(50));

// Count results
const okCount = Object.values(results).filter(r => r === 'OK').length;
const missingCount = Object.values(results).filter(r => r === 'MISSING').length;

console.log(`✅ Configured: ${okCount}`);
console.log(`❌ Missing: ${missingCount}`);
console.log(`📋 Total Required: ${Object.keys(requiredVars).length}`);

if (allGood) {
  console.log('\n🎉 All environment variables are configured!');
  console.log('🚀 You can now start the application with: npm start');
} else {
  console.log('\n⚠️  Some environment variables are missing.');
  console.log('📖 Please check the env-setup.md file for setup instructions.');
  
  console.log('\n🔧 Quick Setup:');
  console.log('1. Create a .env file in the project root');
  console.log('2. Add the missing variables listed above');
  console.log('3. Run this test again: node test-env.js');
}

// Additional validation
console.log('\n🔍 Additional Validation:');

// Test DATABASE_URL format
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    console.log('✅ DATABASE_URL format looks correct');
  } else {
    console.log('⚠️  DATABASE_URL format may be incorrect (should start with postgresql://)');
  }
}

// Test CLOUDFLARE_ENDPOINT format
if (process.env.CLOUDFLARE_ENDPOINT) {
  const endpoint = process.env.CLOUDFLARE_ENDPOINT;
  if (endpoint.includes('r2.cloudflarestorage.com')) {
    console.log('✅ CLOUDFLARE_ENDPOINT format looks correct');
  } else {
    console.log('⚠️  CLOUDFLARE_ENDPOINT format may be incorrect (should contain r2.cloudflarestorage.com)');
  }
}

// Test CLOUDFLARE_PUBLIC_URL format
if (process.env.CLOUDFLARE_PUBLIC_URL) {
  const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL;
  if (publicUrl.startsWith('https://')) {
    console.log('✅ CLOUDFLARE_PUBLIC_URL format looks correct');
  } else {
    console.log('⚠️  CLOUDFLARE_PUBLIC_URL should start with https://');
  }
}

console.log('\n📚 For detailed setup instructions, see: env-setup.md');
console.log('🌐 For deployment help, see: README.md');

// Exit with appropriate code
process.exit(allGood ? 0 : 1); 