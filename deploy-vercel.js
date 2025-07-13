const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying DTRIS to Vercel...');

// Check if dist folder exists
if (!fs.existsSync('dist')) {
  console.log('📦 Building web app...');
  try {
    execSync('npx expo export --platform web', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
} catch (error) {
  console.log('📦 Installing Vercel CLI...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install Vercel CLI:', error.message);
    process.exit(1);
  }
}

// Deploy to Vercel
console.log('🌐 Deploying to Vercel...');
try {
  execSync('vercel --prod dist', { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} 