/**
 * Word GPT Plus - Sideload Verification Utility
 * Checks if the add-in is properly sideloaded
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
    manifestPath: path.resolve(__dirname, '../Manifest.xml'),
    registryPath: 'HKCU\\Software\\Microsoft\\Office\\Word\\Addins\\WordGPTPlus',
    startupPath: path.join(process.env.APPDATA, 'Microsoft', 'Word', 'STARTUP', 'Add-ins', 'WordGPTPlus')
};

// Verify manifest exists
function verifyManifest() {
    console.log('Checking manifest file...');

    if (!fs.existsSync(config.manifestPath)) {
        console.error('❌ Manifest file not found at:', config.manifestPath);
        return false;
    }

    console.log('✅ Manifest file exists');
    return true;
}

// Check registry entries
function checkRegistry() {
    console.log('Checking registry entries...');

    try {
        // Check if registry key exists
        const result = execSync(`reg query "${config.registryPath}" /v LoadBehavior`, { encoding: 'utf8' });

        if (result.includes('LoadBehavior') && result.includes('0x3')) {
            console.log('✅ Registry entries found and valid');
            return true;
        } else {
            console.warn('⚠️ Registry entries found but may not be valid');
            console.log(result);
            return false;
        }
    } catch (error) {
        console.error('❌ Registry entries not found');
        return false;
    }
}

// Check startup folder
function checkStartupFolder() {
    console.log('Checking startup folder...');

    if (!fs.existsSync(config.startupPath)) {
        console.error('❌ Startup folder not found at:', config.startupPath);
        return false;
    }

    // Check if manifest exists in startup folder
    const manifestInStartup = path.join(config.startupPath, 'Manifest.xml');
    if (!fs.existsSync(manifestInStartup)) {
        console.error('❌ Manifest not found in startup folder');
        return false;
    }

    console.log('✅ Startup folder and manifest found');
    return true;
}

// Main verification function
function verifySideload() {
    console.log('Verifying Word GPT Plus sideload status...');

    const manifestOk = verifyManifest();
    const registryOk = checkRegistry();
    const startupOk = checkStartupFolder();

    console.log('\nVerification Summary:');
    console.log('Manifest file:', manifestOk ? '✅ OK' : '❌ Failed');
    console.log('Registry entries:', registryOk ? '✅ OK' : '❌ Failed');
    console.log('Startup folder:', startupOk ? '✅ OK' : '❌ Failed');

    if (manifestOk && registryOk && startupOk) {
        console.log('\n✅ Word GPT Plus appears to be properly sideloaded.');
        console.log('Restart Word to ensure the add-in loads correctly.');
    } else {
        console.log('\n⚠️ Word GPT Plus may not be properly sideloaded.');
        console.log('Try running the installation script again or refer to the manual installation instructions.');
    }
}

// Run the verification
verifySideload();
