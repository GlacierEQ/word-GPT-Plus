/**
 * Word GPT Plus - Start Add-in Script
 * Launches the development server and starts the add-in for testing
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const projectRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(projectRoot, 'manifests', 'manifest.xml');

console.log('Starting Word GPT Plus Add-in development environment...');

try {
    // Start webpack dev server
    console.log('\n📦 Starting webpack development server...');
    execSync('webpack serve --mode development', {
        cwd: projectRoot,
        stdio: 'inherit'
    });

} catch (error) {
    console.error('\n❌ Failed to start development server:', error.message);

    // Check if it's an EADDRINUSE error (port already in use)
    if (error.message.includes('EADDRINUSE')) {
        console.log('\n💡 Tip: Try stopping any processes using port 3000 or change the port in webpack.config.js');
    }

    // Check if SSL certificate issue
    if (error.message.includes('SSL')) {
        console.log('\n💡 Tip: For SSL issues, try running "office-addin-dev-certs install" to install dev certificates');
    }

    process.exit(1);
}
