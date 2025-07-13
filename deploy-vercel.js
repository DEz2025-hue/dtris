#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel deployment for ClaMax DTRIS...');

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
  console.log('📁 Build output in: dist/');
  
  // List build contents
  if (fs.existsSync('dist')) {
    const files = fs.readdirSync('dist');
    console.log('📋 Build contents:', files);
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 