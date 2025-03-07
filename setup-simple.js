const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up Word GPT Plus (Simple Version)...');

// Ensure directories exist
const dirs = [
    path.join(__dirname, 'dist'),
    path.join(__dirname, 'dist', 'assets')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Create dummy assets
const iconSizes = [32, 64];
iconSizes.forEach(size => {
    const iconPath = path.join(__dirname, 'dist', 'assets', `icon-${size}.png`);
    if (!fs.existsSync(iconPath)) {
        // Create a simple colored square (this is just a placeholder)
        try {
            execSync(`convert -size ${size}x${size} xc:#2b579a ${iconPath}`);
            console.log(`Created icon: ${iconPath}`);
        } catch (e) {
            console.log(`Couldn't create icon (ImageMagick not installed?), creating empty file: ${iconPath}`);
            fs.writeFileSync(iconPath, '');
        }
    }
});

// Copy files to dist
const filesToCopy = [
    { src: 'src/simple.html', dest: 'dist/simple.html' },
    { src: 'src/simple-taskpane.js', dest: 'dist/simple-taskpane.js' },
    { src: 'simple-manifest.xml', dest: 'dist/simple-manifest.xml' }
];

filesToCopy.forEach(file => {
    try {
        fs.copyFileSync(path.join(__dirname, file.src), path.join(__dirname, file.dest));
        console.log(`Copied: ${file.src} -> ${file.dest}`);
    } catch (e) {
        console.error(`Error copying ${file.src}: ${e.message}`);
    }
});

console.log('\nSetup complete! To run the add-in:');
console.log('1. Start a local HTTPS server: npx http-server ./dist --ssl --cert office-addin-dev-certs/localhost.crt --key office-addin-dev-certs/localhost.key -p 3000');
console.log('2. Sideload the manifest in Word: Insert > Add-ins > My Add-ins > Upload My Add-in');
console.log('3. Select dist/simple-manifest.xml');
