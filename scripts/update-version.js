/**
 * Automatically updates version numbers across the project
 * Usage: node update-version.js <newVersion>
 * Example: node update-version.js 1.2.3
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get new version from command line
const newVersion = process.argv[2];
if (!newVersion) {
    console.error('Please provide a version number (e.g., node update-version.js 1.2.3)');
    process.exit(1);
}

// Validate version format (semver)
if (!newVersion.match(/^\d+\.\d+\.\d+$/)) {
    console.error('Version must be in the format x.y.z (e.g., 1.2.3)');
    process.exit(1);
}

// Project root directory
const rootDir = path.resolve(__dirname, '..');

// Files to update
const filesToUpdate = [
    {
        path: 'package.json',
        updateFn: (content) => {
            const json = JSON.parse(content);
            json.version = newVersion;
            return JSON.stringify(json, null, 2);
        }
    },
    {
        path: 'package-lock.json',
        updateFn: (content) => {
            const json = JSON.parse(content);
            json.version = newVersion;
            json.packages[''].version = newVersion;
            return JSON.stringify(json, null, 2);
        }
    },
    {
        path: 'manifest.xml',
        updateFn: (content) => {
            return content.replace(/<Version>.*?<\/Version>/, `<Version>${newVersion}</Version>`);
        }
    }
];

console.log(`Updating version to ${newVersion}...`);

// Process each file
filesToUpdate.forEach(({ path: filePath, updateFn }) => {
    try {
        const fullPath = path.join(rootDir, filePath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`File not found: ${filePath}`);
            return;
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        const updatedContent = updateFn(content);
        fs.writeFileSync(fullPath, updatedContent);

        console.log(`✅ Updated ${filePath}`);
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error);
    }
});

// Create a version tag in git
try {
    console.log('Creating git tag...');
    execSync(`git tag v${newVersion}`);
    console.log(`✅ Created git tag v${newVersion}`);
    console.log('To push tag to remote: git push origin --tags');
} catch (error) {
    console.error('❌ Error creating git tag:', error.message);
}

console.log('Version update complete!');
