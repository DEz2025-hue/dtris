#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
    if (fs.existsSync('dist/client/_expo')) {
      execSync('xcopy "dist\\client\\_expo" "dist\\server\\_expo" /E /I /Y', { stdio: 'inherit' });
    }
    
    // Copy assets folder
    if (fs.existsSync('dist/client/assets')) {
      execSync('xcopy "dist\\client\\assets" "dist\\server\\assets" /E /I /Y', { stdio: 'inherit' });
    }
    
    // Copy favicon
    if (fs.existsSync('dist/client/favicon.ico')) {
      execSync('copy "dist\\client\\favicon.ico" "dist\\server\\favicon.ico"', { stdio: 'inherit' });
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