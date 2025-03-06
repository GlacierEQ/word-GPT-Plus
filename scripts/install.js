/**
 * Word GPT Plus - Installation Script
 * Handles the installation process for the Word GPT Plus add-in
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { execSync } = require('child_process');

// Import verification utilities
const { verifyInstallation } = require('./install-verification');

// Configuration
const config = {
    buildDir: path.resolve(__dirname, '../dist'),
    manifestPath: path.resolve(__dirname, '../Manifest.xml'),
    packageDir: path.resolve(__dirname, '../package')
};

/**
 * Main installation function
 */
async function install() {
    console.log(chalk.blue('Word GPT Plus - Installation'));
    console.log(chalk.blue('============================'));

    try {
        // Step 1: Check if build exists
        checkBuild();

        // Step 2: Choose installation method
        const installMethod = await promptInstallationMethod();

        // Step 3: Perform installation based on method
        await performInstallation(installMethod);

        // Step 4: Verify installation
        if (await confirmVerification()) {
            await verifyInstallation();
        }

        console.log(chalk.green('\n✅ Installation process completed!'));
    } catch (error) {
        console.error(chalk.red(`\n❌ Installation failed: ${error.message}`));
        showTroubleshooting(error.message);
        process.exit(1);
    }
}

/**
 * Check if build exists
 */
function checkBuild() {
    console.log(chalk.blue('Checking for built files...'));

    if (!fs.existsSync(config.buildDir)) {
        throw new Error('Build directory not found. Please run npm run build first.');
    }

    const requiredFiles = [
        path.join(config.buildDir, 'taskpane.js'),
        path.join(config.buildDir, 'enhanced-taskpane.html')
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    if (missingFiles.length > 0) {
        throw new Error(`Some required files are missing. Please run npm run build first.`);
    }

    console.log(chalk.green('✓ Build files are ready'));
}

/**
 * Prompt user for installation method
 */
async function promptInstallationMethod() {
    const { method } = await inquirer.prompt([
        {
            type: 'list',
            name: 'method',
            message: 'How would you like to install Word GPT Plus?',
            choices: [
                { name: 'Sideload (development/testing)', value: 'sideload' },
                { name: 'Generate package for deployment', value: 'package' },
                { name: 'Office 365 Admin Center deployment', value: 'admin' },
                { name: 'Just generate instructions', value: 'instructions' }
            ]
        }
    ]);

    return method;
}

/**
 * Perform installation based on chosen method
 * @param {string} method - Installation method
 */
async function performInstallation(method) {
    console.log(chalk.blue(`\nPerforming ${method} installation...`));

    switch (method) {
        case 'sideload':
            await handleSideloading();
            break;
        case 'package':
            await handlePackaging();
            break;
        case 'admin':
            await handleAdminDeployment();
            break;
        case 'instructions':
            generateInstructions();
            break;
        default:
            throw new Error(`Unknown installation method: ${method}`);
    }
}

/**
 * Handle sideloading process
 */
async function handleSideloading() {
    console.log(chalk.blue('Preparing for sideloading...'));

    // Check if office-addin-debugging is available
    let hasDebuggingTool = false;
    try {
        execSync('npx office-addin-debugging --version', { stdio: 'ignore' });
        hasDebuggingTool = true;
    } catch (error) {
        console.log(chalk.yellow('⚠️ office-addin-debugging tool not found. Will use manual instructions.'));
    }

    if (hasDebuggingTool) {
        console.log(chalk.blue('Starting sideloading with office-addin-debugging...'));
        try {
            execSync('npx office-addin-debugging start Manifest.xml', { stdio: 'inherit' });
            console.log(chalk.green('✓ Sideloading process initiated'));
        } catch (error) {
            console.log(chalk.yellow('⚠️ Automated sideloading failed. Falling back to manual instructions.'));
            hasDebuggingTool = false;
        }
    }

    if (!hasDebuggingTool) {
        // Create sideloading instructions
        const sideloadDir = path.join(config.buildDir, 'sideload');
        if (!fs.existsSync(sideloadDir)) {
            fs.mkdirSync(sideloadDir, { recursive: true });
        }

        // Copy manifest to sideload directory
        fs.copyFileSync(config.manifestPath, path.join(sideloadDir, 'Manifest.xml'));

        // Generate instructions
        const instructions = generateSideloadingInstructions();
        fs.writeFileSync(path.join(sideloadDir, 'sideloading-instructions.md'), instructions);

        console.log(chalk.green('✓ Manual sideloading instructions created'));
        console.log(chalk.blue(`Instructions saved to: ${path.join(sideloadDir, 'sideloading-instructions.md')}`));
        console.log(chalk.blue(`Manifest copied to: ${path.join(sideloadDir, 'Manifest.xml')}`));

        // Display key instructions
        console.log(chalk.yellow('\nTo sideload manually:'));
        console.log('1. Open Word');
        console.log('2. Go to Insert > Add-ins > My Add-ins > Upload My Add-in');
        console.log(`3. Select the manifest file from: ${path.join(sideloadDir, 'Manifest.xml')}`);
    }
}

/**
 * Handle packaging for deployment
 */
async function handlePackaging() {
    console.log(chalk.blue('Creating deployment package...'));

    try {
        // Use the existing build script with package-only flag
        execSync('npm run package', { stdio: 'inherit' });
        console.log(chalk.green('✓ Deployment package created successfully'));
    } catch (error) {
        throw new Error(`Package creation failed: ${error.message}`);
    }

    const { configure } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'configure',
            message: 'Would you like to configure deployment settings now?',
            default: true
        }
    ]);

    if (configure) {
        await configureDeployment();
    } else {
        console.log(chalk.blue('You can configure deployment settings later using:'));
        console.log('npm run deploy:dev -- --configure');
    }
}

/**
 * Configure deployment settings
 */
async function configureDeployment() {
    console.log(chalk.blue('\nConfiguring deployment settings...'));

    // Get deployment settings
    const settings = await inquirer.prompt([
        {
            type: 'input',
            name: 'deployUrl',
            message: 'Enter the URL where the add-in will be hosted:',
            validate: input => input.startsWith('https://') ? true : 'URL must start with https://'
        },
        {
            type: 'list',
            name: 'environment',
            message: 'Which environment is this for?',
            choices: ['dev', 'test', 'prod']
        },
        {
            type: 'confirm',
            name: 'sideloadingEnabled',
            message: 'Enable sideloading for this environment?',
            default: true
        }
    ]);

    // Save settings to deployment config
    const configPath = path.resolve(__dirname, '../deploy.config.json');
    const existingConfig = fs.existsSync(configPath) ?
        JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};

    const updatedConfig = {
        ...existingConfig,
        [settings.environment]: {
            url: settings.deployUrl,
            sideloadingEnabled: settings.sideloadingEnabled
        }
    };

    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));

    console.log(chalk.green(`✓ Deployment settings saved for ${settings.environment} environment`));
    console.log(chalk.blue(`To deploy to this environment, run: npm run deploy:${settings.environment}`));
}

/**
 * Handle admin center deployment
 */
async function handleAdminDeployment() {
    console.log(chalk.blue('Preparing for admin center deployment...'));

    // Create package for admin center
    await handlePackaging();

    console.log(chalk.blue('\nTo deploy via Microsoft 365 Admin Center:'));
    console.log('1. Log in to the Microsoft 365 Admin Center (https://admin.microsoft.com)');
    console.log('2. Navigate to Settings > Integrated apps');
    console.log('3. Click "Get apps"');
    console.log('4. Click "Upload custom app"');
    console.log(`5. Upload the package ZIP file from: ${path.resolve(__dirname, '..')}`);
    console.log('6. Follow the prompts to complete deployment');

    console.log(chalk.yellow('\nNote: You need admin privileges in your Microsoft 365 tenant to complete this process.'));
}

/**
 * Generate installation instructions
 */
function generateInstructions() {
    console.log(chalk.blue('Generating installation instructions...'));

    const instructionsDir = path.join(config.buildDir, 'instructions');
    if (!fs.existsSync(instructionsDir)) {
        fs.mkdirSync(instructionsDir, { recursive: true });
    }

    // Generate instructions for different methods
    const instructions = `# Word GPT Plus Installation Instructions

## Installation Methods

Word GPT Plus can be installed using several methods:

### Method 1: Microsoft AppSource (Recommended for End Users)

1. Open Microsoft Word
2. Go to Insert > Add-ins > Get Add-ins
3. Search for "Word GPT Plus"
4. Click "Add" to install the add-in
5. Accept any permission requests

### Method 2: Sideloading (For Development and Testing)

#### Windows:
1. Open Word
2. Go to Insert > Add-ins > My Add-ins > Upload My Add-in
3. Browse to and select the \`Manifest.xml\` file
4. Click "Open" to install the add-in

#### Mac:
1. Open Word
2. Go to Insert > Add-ins > My Add-ins > Upload My Add-in
3. Browse to and select the \`Manifest.xml\` file
4. Click "Open" to install the add-in

#### Web:
1. Go to https://www.office.com/launch/word
2. Create or open a document
3. Go to Insert > Add-ins > Get Add-ins > Upload My Add-in
4. Browse to and select the \`Manifest.xml\` file
5. Click "Upload" to install the add-in

### Method 3: Admin Deployment (For Organizations)

1. Log in to the [Microsoft 365 Admin Center](https://admin.microsoft.com)
2. Navigate to Settings > Integrated apps
3. Click "Get apps"
4. Click "Upload custom app"
5. Upload the package ZIP file
6. Follow the prompts to complete deployment

## After Installation

After installing Word GPT Plus:

1. Open a document in Word
2. Click on the Word GPT Plus button in the ribbon
3. Configure your API keys in the Settings panel
4. Start using the add-in to enhance your documents

## Troubleshooting

If you encounter issues during installation:

- Ensure you're using Microsoft Word 2016 or newer
- Check that you have the necessary permissions
- Verify that your device can access the required URLs
- Try restarting Microsoft Word after installation

For detailed troubleshooting, visit: https://github.com/Kuingsmile/word-GPT-Plus/wiki/Troubleshooting
`;

    fs.writeFileSync(path.join(instructionsDir, 'installation-instructions.md'), instructions);

    console.log(chalk.green('✓ Installation instructions generated'));
    console.log(chalk.blue(`Instructions saved to: ${path.join(instructionsDir, 'installation-instructions.md')}`));
}

/**
 * Generate sideloading instructions
 * @returns {string} Sideloading instructions
 */
function generateSideloadingInstructions() {
    return `# Word GPT Plus - Sideloading Instructions

## Prerequisites

- Microsoft Word 2016 or newer
- Office 365 subscription (recommended)

## Sideloading Steps

### Windows

1. Open Microsoft Word
2. Go to **Insert** tab
3. Click **Add-ins**
4. Select **My Add-ins**
5. Click **Upload My Add-in**
6. Browse to and select the \`Manifest.xml\` file located in this folder
7. Click **Open** to install

### Mac

1. Open Microsoft Word
2. Go to **Insert** tab
3. Click **Add-ins**
4. Select **My Add-ins**
5. Click the ellipsis (...) and select **Upload My Add-in**
6. Browse to and select the \`Manifest.xml\` file located in this folder
7. Click **Open** to install

### Word Online

1. Go to [Word Online](https://www.office.com/launch/word)
2. Open a document
3. Go to **Insert** > **Add-ins**
4. Select **Upload My Add-in**
5. Browse to and select the \`Manifest.xml\` file located in this folder
6. Click **Upload** to install

## After Installation

1. You should see the Word GPT Plus icon in the ribbon
2. Click it to open the add-in panel
3. Configure your settings and start using the add-in

## Troubleshooting

If the add-in doesn't appear:

- Try refreshing the page (in Word Online)
- Restart Word (in desktop version)
- Ensure your organization allows sideloading add-ins
- Check that the URLs in the manifest are accessible
- Clear the Office add-ins cache:
  - Windows: Delete files in \`%LOCALAPPDATA%\\Microsoft\\Office\\16.0\\Wef\\WebExtensionConnector\`
  - Mac: Delete files in \`~/Library/Containers/com.microsoft.Word/Data/Library/Caches/Microsoft/Office/16.0/WebServiceCache/WebExtensionConnector\`

For additional help, visit: https://github.com/Kuingsmile/word-GPT-Plus/issues
`;
}

/**
 * Confirm if user wants to verify the installation
 * @returns {Promise<boolean>} True if user wants to verify
 */
async function confirmVerification() {
    const { verify } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'verify',
            message: 'Would you like to verify the installation now?',
            default: true
        }
    ]);

    return verify;
}

/**
 * Show troubleshooting tips
 */
function showTroubleshooting() {
    console.log(chalk.yellow('\nInstallation Troubleshooting:'));
    console.log('1. Make sure you have run the build process: npm run build');
    console.log('2. Check if all required dependencies are installed: npm install');
    console.log('3. Verify that you have permissions to access all required resources');
    console.log('4. For sideloading issues, ensure your organization allows custom add-ins');
    console.log('5. For deployment issues, check your Azure/web server configuration');

    console.log(chalk.blue('\nFor additional help, please submit an issue at:'));
    console.log('https://github.com/Kuingsmile/word-GPT-Plus/issues');
}

// Run installation when script is executed directly
if (require.main === module) {
    install().catch(error => {
        console.error(chalk.red('Installation process failed with an unhandled error:'));
        console.error(error);
        process.exit(1);
    });
}

module.exports = { install };
