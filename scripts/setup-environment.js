/**
 * Sets up the development environment for Word-GPT-Plus
 * Installs prerequisites and dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Project root directory
const rootDir = path.resolve(__dirname, '..');

// Create command executor with error handling
const exec = (command, options = {}) => {
    try {
        return execSync(command, {
            stdio: options.quiet ? 'pipe' : 'inherit',
            encoding: 'utf8',
            ...options
        });
    } catch (error) {
        if (options.ignoreError) {
            return null;
        }
        throw error;
    }
};

// Create a readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Check for prerequisites
const checkPrerequisites = () => {
    console.log('\n=== Checking Prerequisites ===');

    // Check Node.js version
    try {
        const nodeVersion = exec('node -v', { quiet: true }).trim();
        const version = nodeVersion.replace('v', '').split('.');
        const major = parseInt(version[0]);

        if (major >= 18) {
            console.log(`✅ Node.js ${nodeVersion} (compatible version)`);
        } else {
            console.log(`❌ Node.js ${nodeVersion} (incompatible - need v18+)`);
            console.log('Please install Node.js v18 or higher: https://nodejs.org/');
            process.exit(1);
        }
    } catch (error) {
        console.log('❌ Node.js not installed');
        console.log('Please install Node.js v18 or higher: https://nodejs.org/');
        process.exit(1);
    }

    // Check npm
    try {
        const npmVersion = exec('npm -v', { quiet: true }).trim();
        console.log(`✅ npm ${npmVersion}`);
    } catch (error) {
        console.log('❌ npm not installed');
        console.log('npm should be installed with Node.js');
        process.exit(1);
    }

    // Check Git (optional)
    try {
        const gitVersion = exec('git --version', { quiet: true, ignoreError: true });
        if (gitVersion) {
            console.log(`✅ Git ${gitVersion.trim()}`);
        } else {
            console.log('⚠️ Git not installed (recommended but optional)');
        }
    } catch (error) {
        console.log('⚠️ Git not installed (recommended but optional)');
    }

    // Check for Microsoft Office
    console.log('Checking for Microsoft Office...');
    let officeInstalled = false;

    if (process.platform === 'win32') {
        try {
            // Check common Office installation paths
            const officePaths = [
                'C:\\Program Files\\Microsoft Office',
                'C:\\Program Files (x86)\\Microsoft Office',
                'C:\\Program Files\\Microsoft Office 15',
                'C:\\Program Files\\Microsoft Office 16'
            ];

            for (const path of officePaths) {
                if (fs.existsSync(path)) {
                    console.log(`✅ Microsoft Office found at ${path}`);
                    officeInstalled = true;
                    break;
                }
            }

            if (!officeInstalled) {
                console.log('⚠️ Microsoft Office installation not found in common locations');
                console.log('Word-GPT-Plus requires Microsoft Word to function properly.');
            }
        } catch (error) {
            console.log('⚠️ Could not check for Microsoft Office');
        }
    } else {
        console.log('⚠️ Non-Windows platform detected');
        console.log('Word-GPT-Plus is designed for Microsoft Word on Windows');
    }
};

// Install project dependencies
const installDependencies = () => {
    console.log('\n=== Installing Project Dependencies ===');

    // Check if node_modules exists
    const nodeModulesPath = path.join(rootDir, 'node_modules');
    const forceReinstall = process.argv.includes('--force-reinstall');

    if (fs.existsSync(nodeModulesPath) && !forceReinstall) {
        console.log('📦 Node modules already installed');
        console.log('To force reinstall, run with --force-reinstall');
    } else {
        console.log('Installing dependencies (this may take a few minutes)...');
        exec('npm ci');
        console.log('✅ Dependencies installed successfully');
    }
};

// Setup development certificates
const setupCertificates = () => {
    console.log('\n=== Setting up SSL Certificates for Development ===');

    const certsDir = path.join(rootDir, 'certs');
    const certPath = path.join(certsDir, 'localhost.crt');
    const keyPath = path.join(certsDir, 'localhost.key');

    if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
    }

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        console.log('✅ Development certificates already exist');
    } else {
        console.log('Creating self-signed certificates...');

        // Check for create-cert.js
        const createCertPath = path.join(__dirname, 'create-cert.js');
        if (fs.existsSync(createCertPath)) {
            try {
                exec(`node "${createCertPath}"`);
                console.log('✅ Development certificates created successfully');
            } catch (error) {
                console.log('❌ Failed to create certificates');
                console.log(error.message);
            }
        } else {
            console.log('❌ create-cert.js script not found');
            console.log('Please run the setup from the project root directory');
        }
    }
};

// Create placeholder assets if needed
const setupAssets = () => {
    console.log('\n=== Setting up Assets ===');

    const assetsDir = path.join(rootDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Check for required icons
    const requiredSizes = [16, 32, 64, 80];
    let missingAssets = false;

    for (const size of requiredSizes) {
        const iconPath = path.join(assetsDir, `icon-${size}.png`);
        if (!fs.existsSync(iconPath)) {
            missingAssets = true;
            break;
        }
    }

    if (missingAssets) {
        console.log('Creating placeholder assets...');

        // Check for placeholder asset generator
        const createAssetsPath = path.join(__dirname, 'create-placeholder-assets.js');
        if (fs.existsSync(createAssetsPath)) {
            try {
                exec(`node "${createAssetsPath}"`);
                console.log('✅ Placeholder assets created successfully');
            } catch (error) {
                console.log('❌ Failed to create placeholder assets');
                console.log(error.message);
            }
        } else {
            console.log('⚠️ create-placeholder-assets.js script not found');
            console.log('You will need to manually create icon assets');
        }
    } else {
        console.log('✅ Required assets already exist');
    }
};

// Main function
const main = async () => {
    console.log('===============================================');
    console.log('   WORD-GPT-PLUS ENVIRONMENT SETUP');
    console.log('===============================================\n');

    checkPrerequisites();
    installDependencies();
    setupCertificates();
    setupAssets();

    console.log('\n===============================================');
    console.log('   ENVIRONMENT SETUP COMPLETE!');
    console.log('===============================================');
    console.log('\nNext Steps:');
    console.log('1. Run "npm run dev" to start the development server');
    console.log('2. Run "scripts/automate-all.ps1" to deploy to Word');
    console.log('3. Or use quick-deploy.bat for a one-click solution');
    console.log('\nHappy coding!');

    rl.close();
};

// Run the setup
main().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
});
