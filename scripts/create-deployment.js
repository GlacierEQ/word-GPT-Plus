/**
 * Creates a production deployment package for Word GPT Plus
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Configuration
const config = {
    buildDir: path.resolve(__dirname, '../production-build'),
    manifestPath: path.resolve(__dirname, '../Manifest.xml'),
    outputDir: path.resolve(__dirname, '../deployment'),
    assetsDir: path.resolve(__dirname, '../assets'),
    distDir: path.resolve(__dirname, '../dist'),
    cdnUrl: 'https://yourdomain.com/word-gpt-plus' // Replace with your actual hosting URL
};

// Create directories if they don't exist
[config.buildDir, config.outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Create production build function
async function createProductionBuild() {
    console.log('Creating production build...');

    try {
        // Create production build using webpack
        execSync('npm run build -- --production', { stdio: 'inherit' });

        // Copy build files to production directory
        fs.cpSync(config.distDir, config.buildDir, { recursive: true });

        // Copy assets
        fs.cpSync(config.assetsDir, path.join(config.buildDir, 'assets'), { recursive: true });

        // Create production manifest with updated URLs
        createProductionManifest();

        // Create deployment package
        await createDeploymentPackage();

        console.log('Production build created successfully!');
    } catch (error) {
        console.error('Error creating production build:', error);
        process.exit(1);
    }
}

// Create production manifest with updated URLs
function createProductionManifest() {
    console.log('Creating production manifest...');

    try {
        let manifestContent = fs.readFileSync(config.manifestPath, 'utf8');

        // Replace localhost URLs with production URLs
        manifestContent = manifestContent.replace(
            /https:\/\/localhost:\d+\//g,
            `${config.cdnUrl}/`
        );

        // Write production manifest
        fs.writeFileSync(
            path.join(config.buildDir, 'Manifest.xml'),
            manifestContent
        );

        console.log('Production manifest created successfully');
    } catch (error) {
        console.error('Error creating production manifest:', error);
        process.exit(1);
    }
}

// Create deployment package
async function createDeploymentPackage() {
    console.log('Creating deployment package...');

    return new Promise((resolve, reject) => {
        try {
            // Create a file to stream archive data to
            const output = fs.createWriteStream(path.join(config.outputDir, 'word-gpt-plus-deployment.zip'));
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            // Listen for all archive data to be written
            output.on('close', () => {
                console.log(`Deployment package created: ${archive.pointer()} bytes`);
                resolve();
            });

            // Handle errors
            archive.on('error', (err) => {
                console.error('Error creating archive:', err);
                reject(err);
            });

            // Pipe archive data to the file
            archive.pipe(output);

            // Add the build directory contents to the archive
            archive.directory(config.buildDir, false);

            // Finalize the archive
            archive.finalize();
        } catch (error) {
            console.error('Error creating deployment package:', error);
            reject(error);
        }
    });
}

// Create instructions file
function createInstructions() {
    console.log('Creating installation instructions...');

    const instructionsContent = `# Word GPT Plus Installation Instructions

## Option 1: Installing from the Office Store (Recommended)
1. Open Word
2. Go to Insert > Add-ins > Get Add-ins
3. Search for "Word GPT Plus"
4. Click "Add" to install

## Option 2: Manual Installation
1. Download the Word GPT Plus zip file
2. Extract the contents to a folder
3. In Word, go to Insert > Add-ins > My Add-ins
4. Click "Upload My Add-in" and browse to the extracted Manifest.xml file
5. Click "Open" to install

## After Installation
1. Restart Word
2. The Word GPT Plus add-in should now appear in the Home tab ribbon

For support, please contact support@yourdomain.com
`;

    fs.writeFileSync(
        path.join(config.outputDir, 'Installation-Instructions.md'),
        instructionsContent
    );

    console.log('Instructions created successfully');
}

// Main function
async function main() {
    console.log('Creating Word GPT Plus deployment package...');

    await createProductionBuild();
    createInstructions();

    console.log('\nDeployment package creation completed!');
    console.log(`Deployment package location: ${path.join(config.outputDir, 'word-gpt-plus-deployment.zip')}`);
    console.log('You can now distribute this package to users or upload it to your hosting provider.');
}

main();
