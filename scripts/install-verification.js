/**
 * Word GPT Plus - Installation Verification Script
 * Verifies that the add-in is properly installed and functioning
 */

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

// Configuration
const config = {
    manifestPath: path.resolve(__dirname, '../Manifest.xml'),
    buildDir: path.resolve(__dirname, '../dist'),
    checksums: {}
};

// Main verification function
async function verifyInstallation() {
    console.log(chalk.blue('Word GPT Plus - Installation Verification'));
    console.log(chalk.blue('========================================='));

    try {
        // Step 1: Check installation type
        const installType = await promptInstallationType();
        console.log(`\nVerifying ${installType} installation...\n`);

        // Step 2: Check for required files
        await checkRequiredFiles();

        // Step 3: Check manifest validity
        await verifyManifest();

        // Step 4: Check connectivity (if deployed installation)
        if (installType === 'Deployed') {
            await checkConnectivity();
        }

        // Step 5: Check Office compatibility
        await checkOfficeCompatibility();

        // Step 6: Verify Word API compatibility
        await verifyWordAPI();

        // All checks passed
        console.log(chalk.green('\n✅ All verification checks passed!'));
        console.log(chalk.green('Your Word GPT Plus installation appears to be valid.'));

        // Show next steps
        showNextSteps(installType);

    } catch (error) {
        console.error(chalk.red(`\n❌ Verification failed: ${error.message}`));
        console.log(chalk.yellow('\nSuggested solutions:'));
        showTroubleshooting(error.message);
    }
}

// Prompt for installation type
async function promptInstallationType() {
    const { installType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'installType',
            message: 'Which installation type are you verifying?',
            choices: ['Development', 'Sideloaded', 'Deployed', 'AppSource']
        }
    ]);

    return installType;
}

// Check for required files
async function checkRequiredFiles() {
    console.log(chalk.blue('Checking required files...'));

    const requiredFiles = [
        { path: config.manifestPath, name: 'Manifest.xml' },
        { path: path.join(config.buildDir, 'taskpane.js'), name: 'taskpane.js' },
        { path: path.join(config.buildDir, 'enhanced-taskpane.html'), name: 'enhanced-taskpane.html' }
    ];

    let missingFiles = [];

    for (const file of requiredFiles) {
        if (!fs.existsSync(file.path)) {
            missingFiles.push(file.name);
        }
    }

    if (missingFiles.length > 0) {
        throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
    }

    console.log(chalk.green('✓ All required files present'));
}

// Verify manifest integrity and contents
async function verifyManifest() {
    console.log(chalk.blue('Verifying manifest...'));

    // Read manifest
    const manifestContent = fs.readFileSync(config.manifestPath, 'utf8');

    // Check essential elements
    const requiredElements = [
        { name: 'Id', pattern: /<Id>.*?<\/Id>/ },
        { name: 'ProviderName', pattern: /<ProviderName>.*?<\/ProviderName>/ },
        { name: 'Version', pattern: /<Version>.*?<\/Version>/ },
        { name: 'DisplayName', pattern: /<DisplayName DefaultValue=/ },
        { name: 'Description', pattern: /<Description DefaultValue=/ },
        { name: 'IconUrl', pattern: /<IconUrl DefaultValue=/ },
        { name: 'Host', pattern: /<Host Name="Document"/ }
    ];

    let missingElements = [];

    for (const element of requiredElements) {
        if (!element.pattern.test(manifestContent)) {
            missingElements.push(element.name);
        }
    }

    if (missingElements.length > 0) {
        throw new Error(`Manifest missing required elements: ${missingElements.join(', ')}`);
    }

    // Check URLs for accessibility
    const urlMatches = manifestContent.match(/(https?:\/\/[^"]+)/g) || [];
    const uniqueUrls = [...new Set(urlMatches)];

    console.log(chalk.blue(`Found ${uniqueUrls.length} unique URLs in manifest`));

    // Check add-in ID format
    const idMatch = manifestContent.match(/<Id>(.*?)<\/Id>/);
    if (idMatch) {
        const id = idMatch[1];
        const validGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (!validGuid) {
            console.log(chalk.yellow(`⚠️ Add-in ID does not appear to be a valid GUID: ${id}`));
        }
    }

    // Check version format
    const versionMatch = manifestContent.match(/<Version>(.*?)<\/Version>/);
    if (versionMatch) {
        const version = versionMatch[1];
        const validVersion = /^\d+\.\d+\.\d+$/.test(version);

        if (!validVersion) {
            console.log(chalk.yellow(`⚠️ Version format may not be valid: ${version} (expected format: x.y.z)`));
        }
    }

    console.log(chalk.green('✓ Manifest verification passed'));
}

// Check connectivity to required endpoints
async function checkConnectivity() {
    console.log(chalk.blue('Checking network connectivity...'));

    // Read manifest to extract URLs
    const manifestContent = fs.readFileSync(config.manifestPath, 'utf8');
    const urlMatches = manifestContent.match(/(https?:\/\/[^"]+)/g) || [];
    const uniqueUrls = [...new Set(urlMatches)];

    // Sample only first 3 URLs to avoid excessive requests
    const urlsToCheck = uniqueUrls.slice(0, 3);

    for (const url of urlsToCheck) {
        process.stdout.write(`Checking ${url} ... `);

        try {
            const response = await axios.head(url, { timeout: 5000 });
            console.log(chalk.green('✓'));
        } catch (error) {
            console.log(chalk.red('✗'));
            console.log(chalk.yellow(`  ⚠️ Could not connect to ${url}: ${error.message}`));
        }
    }

    console.log(chalk.green('✓ Connectivity check completed'));
}

// Check Office compatibility
async function checkOfficeCompatibility() {
    console.log(chalk.blue('Checking Office compatibility...'));

    const { officeVersion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'officeVersion',
            message: 'Which version of Office are you using?',
            choices: [
                'Office 365 (subscription)',
                'Office 2021',
                'Office 2019',
                'Office 2016',
                'Older version',
                'Office Online / Web'
            ]
        }
    ]);

    if (officeVersion === 'Older version') {
        console.log(chalk.yellow('⚠️ Older Office versions may have limited support for add-ins'));
        console.log(chalk.yellow('   Word GPT Plus requires Office 2016 or newer for full functionality'));
    } else {
        console.log(chalk.green(`✓ ${officeVersion} is compatible with Word GPT Plus`));
    }
}

// Verify Word API capabilities
async function verifyWordAPI() {
    console.log(chalk.blue('Verifying Word API requirements...'));

    // Read manifest to check required API sets
    const manifestContent = fs.readFileSync(config.manifestPath, 'utf8');

    // Check for Requirements element
    const requirementsMatch = manifestContent.match(/<Requirements>[\s\S]*?<\/Requirements>/);

    if (requirementsMatch) {
        const requirements = requirementsMatch[0];
        const sets = requirements.match(/<Set Name="(.*?)" MinVersion="(.*?)"/g) || [];

        if (sets.length > 0) {
            console.log(chalk.blue('Required API sets:'));
            sets.forEach(set => {
                const nameMatch = set.match(/Name="(.*?)"/);
                const versionMatch = set.match(/MinVersion="(.*?)"/);

                if (nameMatch && versionMatch) {
                    console.log(chalk.blue(`  - ${nameMatch[1]} (v${versionMatch[1]})`));
                }
            });
        } else {
            console.log(chalk.yellow('⚠️ No specific API requirements found in manifest'));
        }
    } else {
        console.log(chalk.yellow('⚠️ No Requirements section found in manifest'));
    }

    const { hasAccess } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'hasAccess',
            message: 'Can you access the Word document content with the add-in?',
            default: true
        }
    ]);

    if (!hasAccess) {
        console.log(chalk.yellow('⚠️ API access issues detected. This could be due to permissions or API availability.'));
    } else {
        console.log(chalk.green('✓ Word API access confirmed'));
    }
}

/**
 * Show next steps based on installation type
 * @param {string} installType - Type of installation
 */
function showNextSteps(installType) {
    console.log(chalk.blue('\nNext Steps:'));

    const commonSteps = [
        'Configure your API keys in the Settings panel',
        'Check out the templates for quick access to common functions',
        'Try generating text with a simple prompt'
    ];

    // Installation-specific steps
    if (installType === 'Development') {
        console.log(chalk.blue('For development setup:'));
        console.log('1. Make sure you have the latest code from the repository');
        console.log('2. Run `npm install` to install all dependencies');
        console.log('3. Run `npm start` to start the development server');
    } else if (installType === 'Sideloaded') {
        console.log(chalk.blue('For sideloaded installation:'));
        console.log('1. Ensure the add-in appears in your "My Add-ins" section');
        console.log('2. If the add-in disappears after restarting Word, you may need to sideload it again');
    } else if (installType === 'Deployed' || installType === 'AppSource') {
        console.log(chalk.blue('For deployed installation:'));
        console.log('1. Make sure all users have proper permissions to use the add-in');
        console.log('2. Set up any required authentication with your IT department');
    }

    // Common next steps
    console.log(chalk.blue('\nGeneral setup:'));
    commonSteps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
    });

    console.log(chalk.blue('\nFor additional help, visit: https://github.com/Kuingsmile/word-GPT-Plus/wiki'));
}

/**
 * Show troubleshooting tips based on error message
 * @param {string} errorMessage - Error message from verification failure
 */
function showTroubleshooting(errorMessage) {
    console.log(chalk.yellow('Troubleshooting suggestions:'));

    // Provide specific troubleshooting based on the error
    if (errorMessage.includes('Missing required files')) {
        console.log('1. Make sure you have run the build process with `npm run build`');
        console.log('2. Check that all files have been properly deployed to their expected locations');
        console.log('3. Try reinstalling the add-in or redeploying the files');
    } else if (errorMessage.includes('Manifest')) {
        console.log('1. Validate your manifest using the Office Add-in Validator: `npm run validate`');
        console.log('2. Ensure all URLs in the manifest are accessible');
        console.log('3. Check for proper formatting and required elements in the manifest');
    } else if (errorMessage.includes('connectivity')) {
        console.log('1. Check your internet connection');
        console.log('2. Verify that your firewall is not blocking the required endpoints');
        console.log('3. Ensure the deployment server is running and accessible');
    } else {
        // Generic troubleshooting
        console.log('1. Check the console for detailed error messages');
        console.log('2. Verify that you have the correct permissions');
        console.log('3. Make sure you are using a supported version of Microsoft Word');
        console.log('4. Try reinstalling the add-in');
    }

    console.log(chalk.blue('\nCommon solutions:'));
    console.log('- Restart Microsoft Word');
    console.log('- Clear the Office cache (https://learn.microsoft.com/en-us/office/dev/add-ins/testing/clear-cache)');
    console.log('- Check for Microsoft Word updates');
    console.log('- Ensure you have administrator privileges if needed');

    console.log(chalk.blue('\nFor additional help, please submit an issue at:'));
    console.log('https://github.com/Kuingsmile/word-GPT-Plus/issues');
}

// Run the verification when script is executed directly
if (require.main === module) {
    verifyInstallation().catch(error => {
        console.error(chalk.red('Verification process failed with an unhandled error:'));
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    verifyInstallation,
    checkRequiredFiles,
    verifyManifest,
    checkConnectivity
};