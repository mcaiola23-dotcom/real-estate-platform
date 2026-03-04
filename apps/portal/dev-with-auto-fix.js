#!/usr/bin/env node

/**
 * Development server with automatic cache corruption fix
 * Monitors for Next.js cache errors and auto-clears when detected
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const nextCacheDir = path.join(__dirname, '.next');
const nodeModulesCacheDir = path.join(__dirname, 'node_modules', '.cache');

let restartCount = 0;
const MAX_RESTARTS = 3;

function clearCaches() {
  console.log('🧹 Clearing Next.js caches...');
  
  try {
    if (fs.existsSync(nextCacheDir)) {
      fs.rmSync(nextCacheDir, { recursive: true, force: true });
      console.log('  ✓ Cleared .next folder');
    }
    if (fs.existsSync(nodeModulesCacheDir)) {
      fs.rmSync(nodeModulesCacheDir, { recursive: true, force: true });
      console.log('  ✓ Cleared node_modules/.cache folder');
    }
  } catch (error) {
    console.error('  ✗ Error clearing caches:', error.message);
  }
}

function startDevServer() {
  console.log('\n🚀 Starting Next.js development server...\n');
  
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true,
    cwd: __dirname
  });

  let hasError = false;
  
  devServer.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    
    // Check for successful start
    if (output.includes('Ready in')) {
      restartCount = 0; // Reset counter on successful start
    }
  });

  devServer.stderr.on('data', (data) => {
    const error = data.toString();
    process.stderr.write(error);
    
    // Detect cache corruption errors
    const cacheErrors = [
      'UNKNOWN: unknown error',
      'app-paths-manifest.json',
      'middleware-build-manifest.js',
      'ENOENT',
      'Cannot find module'
    ];
    
    const isCacheError = cacheErrors.some(err => error.includes(err));
    
    if (isCacheError && !hasError) {
      hasError = true;
      console.error('\n❌ Cache corruption detected!\n');
      
      // Kill the dev server
      devServer.kill();
      
      if (restartCount < MAX_RESTARTS) {
        restartCount++;
        console.log(`🔄 Auto-fixing... (Attempt ${restartCount}/${MAX_RESTARTS})\n`);
        
        // Clear caches and restart
        setTimeout(() => {
          clearCaches();
          setTimeout(() => {
            startDevServer();
          }, 1000);
        }, 1000);
      } else {
        console.error(`\n⚠️  Failed to auto-fix after ${MAX_RESTARTS} attempts.`);
        console.error('Please try manually:');
        console.error('  1. Close all terminal windows');
        console.error('  2. Delete .next folder');
        console.error('  3. Run: npm run dev\n');
        process.exit(1);
      }
    }
  });

  devServer.on('exit', (code) => {
    if (code !== 0 && !hasError && restartCount < MAX_RESTARTS) {
      console.log('\n⚠️  Server exited unexpectedly, restarting...\n');
      restartCount++;
      setTimeout(() => {
        startDevServer();
      }, 2000);
    }
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...\n');
    devServer.kill();
    process.exit(0);
  });
}

// Initial cache clear on first run
console.log('🔧 SmartMLS AI Platform - Development Server\n');
console.log('📋 Features:');
console.log('  • Automatic cache corruption detection');
console.log('  • Auto-restart on errors');
console.log('  • Graceful shutdown (Ctrl+C)\n');

clearCaches();
setTimeout(() => {
  startDevServer();
}, 1000);


