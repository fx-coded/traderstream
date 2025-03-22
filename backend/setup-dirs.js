/**
 * Script to set up the directory structure and copy files to the right locations
 */

const fs = require('fs');
const path = require('path');

// Directories to create
const directories = [
  'routes',
  'middleware',
  'config',
  'services',
  'utils',
  'models',
  'socket'
];

// Create directories if they don't exist
function createDirectories() {
  console.log('Creating directory structure...');
  
  directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dirPath, { recursive: true });
    } else {
      console.log(`Directory exists: ${dir}`);
    }
  });
  
  console.log('Directory structure created successfully.');
}

// Main function
function main() {
  console.log('Setting up the project structure...');
  createDirectories();
  console.log('Setup complete.');
}

// Run the main function
main();