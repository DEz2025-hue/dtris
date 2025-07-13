#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('🚀 Starting Netlify deployment for ClaMax DTRIS...');

try {
  // Clean previous build
  if (fs.existsSync('dist')) {
    console.log('🧹 Cleaning previous build...');
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build the web app
  console.log('📦 Building Expo web app...');
  execSync('npx expo export --platform web', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  console.log('✅ Build completed successfully!');
  
  // Copy client assets to server folder for Netlify
  if (fs.existsSync('dist/client') && fs.existsSync('dist/server')) {
    console.log('📁 Copying client assets to server folder...');
    // Copy _expo folder
    copyRecursiveSync('dist/client/_expo', 'dist/server/_expo');
    // Copy assets folder
    copyRecursiveSync('dist/client/assets', 'dist/server/assets');
    // Copy favicon
    if (fs.existsSync('dist/client/favicon.ico')) {
      fs.copyFileSync('dist/client/favicon.ico', 'dist/server/favicon.ico');
    }
    console.log('✅ Assets copied successfully!');
  }
  
  console.log('📁 Build output in: dist/server/');
  
  // List build contents
  if (fs.existsSync('dist/server')) {
    const files = fs.readdirSync('dist/server');
    console.log('📋 Server folder contents:', files);
    
    // Check if index.html exists
    if (fs.existsSync('dist/server/index.html')) {
      console.log('✅ index.html found - ready for Netlify deployment');
    } else {
      console.log('⚠️  index.html not found in dist/server/');
    }
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 