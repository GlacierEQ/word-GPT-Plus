/**
 * Word-GPT-Plus setup script
 * 
 * Initializes the project by installing dependencies,
 * setting up certificates, and configuring the environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Word-GPT-Plus project...');

// Helper function to run commands
function runCommand(command) {
    console.log(`\n> ${command}`);
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        return false;
    }
}

// Check and install npm dependencies
console.log('\n📦 Installing dependencies...');
if (!runCommand('npm install')) {
    console.error('Failed to install dependencies. Please try running npm install manually.');
    process.exit(1);
}

// Create certificates for HTTPS if needed
console.log('\n🔒 Setting up SSL certificates...');
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
    console.log('Created certs directory');
}

const certPath = path.join(certsDir, 'localhost.crt');
const keyPath = path.join(certsDir, 'localhost.key');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('SSL certificates missing. Creating...');
    runCommand('node ./scripts/create-cert.js');
} else {
    console.log('SSL certificates already exist');
}

// Set up the Word add-in
console.log('\n📝 Setting up Word add-in integration...');
runCommand('powershell -ExecutionPolicy Bypass -File "./scripts/auto-updater.ps1"');

// Build the project
console.log('\n🔨 Building the project...');
if (!runCommand('npm run build')) {
    console.error('Failed to build the project.');
    process.exit(1);
}

console.log('\n✅ Setup completed successfully!');
console.log('\n🚀 Start development server with: npm run dev');
