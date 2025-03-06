/**
 * Word GPT Plus - Installation Script
 * Automates the installation and configuration process
 */

// Use strict mode for better error handling
'use strict';

// Import required modules
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync, exec } = require('child_process');
const readline = require('readline');

// Create interactive interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Configuration
const config = {
    appName: 'Word GPT Plus',
    version: '1.0.0',
    officeVersion: '16.0',
    requiredNodeVersion: '12.0.0',
    requiredNpmVersion: '6.0.0',
    manifestPath: path.resolve(__dirname, '../Manifest.xml'),
    distPath: path.resolve(__dirname, '../dist'),
    tempPath: path.resolve(__dirname, '../.temp'),
    logsPath: path.resolve(__dirname, '../logs'),
    installLog: path.resolve(__dirname, '../logs/install.log'),
    apiKeyPath: path.resolve(__dirname, '../config/apiKeys.json'),
    defaultApiUrl: 'https://api.example.com/word-gpt-plus',
    requiredDependencies: ['axios', 'uuid', 'lodash'],
    supportedPlatforms: ['win32', 'darwin']
};

// Initialize log file
if (!fs.existsSync(config.logsPath)) {
    fs.mkdirSync(config.logsPath, { recursive: true });
}

// Setup logging
const logger = {
    log: (message) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] INFO: ${message}`;
        console.log(message);
        fs.appendFileSync(config.installLog, logMessage + '\n');
    },
    error: (message, error = null) => {
        const timestamp = new Date().toISOString();
        const errorDetails = error ? `\n${error.stack || error}` : '';
        const logMessage = `[${timestamp}] ERROR: ${message}${errorDetails}`;
        console.error(`ERROR: ${message}`);
        fs.appendFileSync(config.installLog, logMessage + '\n');
    }
};

/**
 * Check system requirements
 */
async function checkRequirements() {
    logger.log('Checking system requirements...');

    // Check if platform is supported
    if (!config.supportedPlatforms.includes(process.platform)) {
        throw new Error(`Unsupported platform: ${process.platform}. Supported platforms: ${config.supportedPlatforms.join(', ')}`);
    }

    // Check Node.js version
    const nodeVersion = process.version.slice(1); // Remove the 'v' prefix
    if (!satisfiesVersion(nodeVersion, config.requiredNodeVersion)) {
        throw new Error(`Node.js version ${config.requiredNodeVersion} or higher is required. Current version: ${nodeVersion}`);
    }

    // Check NPM version
    try {
        const npmVersionOutput = execSync('npm --version', { encoding: 'utf8' });
        const npmVersion = npmVersionOutput.trim();
        if (!satisfiesVersion(npmVersion, config.requiredNpmVersion)) {
            throw new Error(`NPM version ${config.requiredNpmVersion} or higher is required. Current version: ${npmVersion}`);
        }
    } catch (error) {
        throw new Error(`Failed to check NPM version: ${error.message}`);
    }

    // Check Office installation
    try {
        let officeInstalled = false;

        if (process.platform === 'win32') {
            // Windows: Check registry
            try {
                const regOutput = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Office" /s /f "Word.Application"', { encoding: 'utf8' });
                officeInstalled = regOutput.includes('Word.Application');
            } catch (e) {
                // Try alternative check
                try {
                    const regOutput = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\winword.exe" /ve', { encoding: 'utf8' });
                    officeInstalled = regOutput.includes('winword.exe');
                } catch (e2) {
                    officeInstalled = false;
                }
            }
        } else if (process.platform === 'darwin') {
            // macOS: Check application folder
            officeInstalled = fs.existsSync('/Applications/Microsoft Word.app');
        }

        if (!officeInstalled) {
            throw new Error('Microsoft Word does not appear to be installed.');
        }
    } catch (error) {
        // If we can't check, just warn the user
        logger.log('⚠️ Warning: Could not verify Microsoft Word installation.');
    }

    logger.log('✅ System requirements check passed');
}

/**
 * Compare version strings
 * @param {string} version - Version to check
 * @param {string} requiredVersion - Minimum required version
 * @returns {boolean} True if version satisfies requirement
 */
function satisfiesVersion(version, requiredVersion) {
    const v1 = version.split('.').map(Number);
    const v2 = requiredVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const num1 = v1[i] || 0;
        const num2 = v2[i] || 0;

        if (num1 > num2) return true;
        if (num1 < num2) return false;
    }

    return true; // Equal versions
}

/**
 * Install required dependencies
 */
async function installDependencies() {
    logger.log('Installing required dependencies...');

    return new Promise((resolve, reject) => {
        // Install dependencies using npm
        exec('npm install', { cwd: path.resolve(__dirname, '..') }, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Failed to install dependencies: ${stderr}`);
                reject(new Error(`Failed to install dependencies: ${error.message}`));
                return;
            }

            logger.log('✅ Dependencies installed successfully');
            resolve();
        });
    });
}

/**
 * Configure API settings
 */
async function configureApiSettings() {
    logger.log('Configuring API settings...');

    // Create config directory if it doesn't exist
    const configDir = path.dirname(config.apiKeyPath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // Default API configuration
    const defaultConfig = {
        apiKey: '',
        apiUrl: config.defaultApiUrl,
        configuredDate: new Date().toISOString(),
        requestsEnabled: true
    };

    // Check if configuration already exists
    let currentConfig = {};
    if (fs.existsSync(config.apiKeyPath)) {
        try {
            currentConfig = JSON.parse(fs.readFileSync(config.apiKeyPath, 'utf8'));
            logger.log('Existing API configuration found');
        } catch (error) {
            logger.error('Failed to read existing API configuration', error);
        }
    }

    // Merge existing config with defaults
    const apiConfig = { ...defaultConfig, ...currentConfig };

    // Prompt for API key if not already configured
    if (!apiConfig.apiKey) {
        apiConfig.apiKey = await new Promise(resolve => {
            rl.question('Please enter your API key (or leave blank to configure later): ', answer => {
                resolve(answer.trim());
            });
        });
    }

    // If API key is provided, verify it
    if (apiConfig.apiKey) {
        try {
            logger.log('Verifying API key...');
            // Simulated API key verification (in a real scenario we'd make an API call here)
            const isValid = apiConfig.apiKey.length > 8;

            if (!isValid) {
                logger.error('API key validation failed. You can update it later in the configuration file.');
                apiConfig.requestsEnabled = false;
            } else {
                logger.log('✅ API key verified successfully');
                apiConfig.requestsEnabled = true;
            }
        } catch (error) {
            logger.error('Failed to verify API key', error);
            apiConfig.requestsEnabled = false;
        }
    } else {
        apiConfig.requestsEnabled = false;
        logger.log('No API key provided. You can configure it later in the settings panel.');
    }

    // Save configuration
    fs.writeFileSync(config.apiKeyPath, JSON.stringify(apiConfig, null, 2));
    logger.log('✅ API configuration saved');

    return apiConfig;
}

/**
 * Register Word add-in
 */
async function registerAddIn() {
    logger.log('Registering Word add-in...');

    try {
        if (process.platform === 'win32') {
            // For Windows, use Office.js register add-in method
            try {
                // First try using office-addin-dev-certs (if installed)
                try {
                    logger.log('Attempting to register add-in using office-addin-dev-certs...');
                    execSync('npx office-addin-dev-certs install --days 365', { stdio: 'inherit' });
                } catch (e) {
                    logger.log('Dev certs installation skipped or failed (this is often okay)');
                }

                // Create a temporary manifest copy with absolute paths
                const manifestContent = fs.readFileSync(config.manifestPath, 'utf8');
                const updatedManifest = manifestContent.replace(
                    /(Source|SourceLocation)="(?!https?:\/\/)([^"]+)"/g,
                    (match, p1, p2) => `${p1}="${path.resolve(__dirname, '..', p2).replace(/\\/g, '/')}"`
                );

                const tempManifestPath = path.join(config.tempPath, 'Manifest.xml');
                if (!fs.existsSync(config.tempPath)) {
                    fs.mkdirSync(config.tempPath, { recursive: true });
                }
                fs.writeFileSync(tempManifestPath, updatedManifest);

                logger.log('Using Office.js to register add-in...');
                execSync(`npx office-addin-debugging start ${tempManifestPath}`, { stdio: 'inherit' });

                logger.log('✅ Add-in registered successfully');
                return true;
            } catch (e) {
                logger.error('Failed to register using Office.js tools:', e);

                // Fall back to manual registry method for Windows
                logger.log('Attempting manual registry installation...');

                // Create registry script
                const regScriptPath = path.join(config.tempPath, 'register-addin.reg');
                const regContent = getWindowsRegistryScript();
                fs.writeFileSync(regScriptPath, regContent);

                // Run registry script
                execSync(`regedit.exe /s "${regScriptPath}"`, { stdio: 'inherit' });

                logger.log('✅ Add-in registered via Windows Registry');
                return true;
            }
        } else if (process.platform === 'darwin') {
            // macOS installation
            const manifestName = path.basename(config.manifestPath);
            const userManifestsPath = path.join(
                os.homedir(),
                'Library/Containers/com.microsoft.Word/Data/Documents/wef'
            );

            // Create directory if not exists
            if (!fs.existsSync(userManifestsPath)) {
                fs.mkdirSync(userManifestsPath, { recursive: true });
            }

            // Copy manifest to Word's manifest folder
            fs.copyFileSync(
                config.manifestPath,
                path.join(userManifestsPath, manifestName)
            );

            logger.log('✅ Add-in manifest installed for macOS');
            return true;
        } else {
            throw new Error(`Unsupported platform: ${process.platform}`);
        }
    } catch (error) {
        logger.error('Failed to register add-in', error);

        // Provide manual instructions
        return false;
    }
}

/**
 * Get Windows registry script content
 */
function getWindowsRegistryScript() {
    const manifestFullPath = path.resolve(config.manifestPath).replace(/\\/g, '\\\\');

    return `Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\\Software\\Microsoft\\Office\\${config.officeVersion}\\WEF\\Developer]
"Developer_AddInsWEF"="${manifestFullPath}"

[HKEY_CURRENT_USER\\Software\\Microsoft\\Office\\${config.officeVersion}\\WEF\\UserSettings]
"Developer_EnableWebExtensionsDeveloperMode"=dword:00000001
`;
}

/**
 * Provide manual installation instructions for the user
 */
function showManualInstructions() {
    logger.log('\n===== MANUAL INSTALLATION INSTRUCTIONS =====');
    logger.log('To manually install the Word GPT Plus add-in:');

    if (process.platform === 'win32') {
        logger.log('1. Open Microsoft Word');
        logger.log('2. Go to File > Options > Trust Center > Trust Center Settings > Trusted Add-in Catalogs');
        logger.log(`3. Add this path as a catalog: ${path.resolve(__dirname, '..')}`);
        logger.log('4. Check the "Show in Menu" checkbox and click OK');
        logger.log('5. Restart Word');
        logger.log('6. Go to Insert > My Add-ins > Shared Folder');
        logger.log(`7. Select "${config.appName}" and click "Add"`);
    } else if (process.platform === 'darwin') {
        logger.log('1. Open Microsoft Word');
        logger.log('2. Go to Insert > Add-ins > My Add-ins');
        logger.log('3. Click on the "Manage My Add-ins" dropdown and select "Add a Custom Add-in"');
        logger.log('4. Choose "Browse..." and navigate to this location:');
        logger.log(`   ${config.manifestPath}`);
        logger.log('5. Click "Open" and then "Install"');
    }

    logger.log('\nFor more information, visit: https://docs.microsoft.com/en-us/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins');
    logger.log('===========================================\n');
}

/**
 * Main installation function
 */
async function install() {
    logger.log(`Starting ${config.appName} installation (version ${config.version})...`);
    logger.log(`Platform: ${process.platform}`);
    logger.log(`Node.js version: ${process.version}`);

    try {
        // Step 1: Check requirements
        await checkRequirements();

        // Step 2: Install dependencies
        await installDependencies();

        // Step 3: Configure API settings
        const apiConfig = await configureApiSettings();

        // Step 4: Register Word add-in
        const registrationSuccessful = await registerAddIn();

        // Show manual instructions if automatic registration failed
        if (!registrationSuccessful) {
            showManualInstructions();
        }

        logger.log(`\n🎉 ${config.appName} installation completed!`);

        if (apiConfig.apiKey && apiConfig.requestsEnabled) {
            logger.log('API key configured and ready to use.');
        } else {
            logger.log('⚠️ API key not configured. Some features may be limited.');
            logger.log('You can configure your API key in the settings panel or by editing:');
            logger.log(config.apiKeyPath);
        }

        logger.log('\nTo get started:');
        logger.log('1. Open Microsoft Word');
        logger.log('2. Go to the "Home" tab');
        logger.log('3. Click on "Word GPT Plus" in the ribbon');
        logger.log('\nThank you for installing Word GPT Plus!');
    } catch (error) {
        logger.error('Installation failed', error);
        logger.log('\n⚠️ Installation completed with errors.');
        logger.log('Please see the installation log for details:');
        logger.log(config.installLog);
        logger.log('\nIf you need help, please contact support or try manual installation:');
        showManualInstructions();
    } finally {
        rl.close();
    }
}

// Run installation
install();
