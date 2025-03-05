/**
 * Script to launch the add-in using office-addin-debugging
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting Word-GPT-Plus in Word...');

try {
    // First make sure we build the project
    execSync('npm run build', { stdio: 'inherit' });

    // Use the office-addin-debugging tool to start debugging
    execSync('npx office-addin-debugging start manifest.xml', { stdio: 'inherit' });

    console.log('✅ Add-in started successfully!');
    console.log('Word should launch automatically with the add-in loaded.');
} catch (error) {
    console.error('Error starting add-in:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have installed the dev dependencies: npm run fix-deps');
    console.log('2. Ensure Microsoft Word is installed on your system');
    console.log('3. Check that the webpack dev server is running: npm run dev (in another terminal)');
}
