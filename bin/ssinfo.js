#!/usr/bin/env node

/**
 * ssinfo - GitHub Explorer CLI Launcher
 * 
 * This script launches the web-based terminal interface.
 * Since ssinfo is a web application, this CLI wrapper opens it in the browser.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n\x1b[32m  _____ _____ _____ _   _ ______ ____  \x1b[0m');
console.log('\x1b[32m / ____/ ____|_   _| \\ | |  ____/ __ \\ \x1b[0m');
console.log('\x1b[32m| (___| (___   | | |  \\| | |__ | |  | |\x1b[0m');
console.log('\x1b[32m \\___ \\\\___ \\  | | | . ` |  __|| |  | |\x1b[0m');
console.log('\x1b[32m ____) |___) |_| |_| |\\  | |   | |__| |\x1b[0m');
console.log('\x1b[32m|_____/_____/|_____|_| \\_|_|    \\____/ \x1b[0m');
console.log('\n\x1b[1m>> ssinfo v1.0.0\x1b[0m');
console.log('\x1b[36m>> Launching Web Terminal Interface...\x1b[0m');

// Determine the path to index.html
// In a real installed package, this might be slightly different depending on structure
const htmlPath = path.resolve(__dirname, '../index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('\x1b[31mError: Could not find application entry point (index.html).\x1b[0m');
  process.exit(1);
}

// Command to open browser based on OS
const startCommand = process.platform == 'darwin' ? 'open' : 
                     process.platform == 'win32' ? 'start' : 'xdg-open';

// Inform user
console.log(`>> Opening: ${htmlPath}`);
console.log('>> \x1b[33mNote:\x1b[0m If the app does not load correctly (CORS errors), please run via a local server:');
console.log('   \x1b[37mnpx serve .\x1b[0m');

// Execute open command
exec(`${startCommand} "${htmlPath}"`, (error) => {
  if (error) {
    console.error('\x1b[31mFailed to open browser automatically.\x1b[0m');
    console.error(`Please open this file manually: ${htmlPath}`);
  }
});
