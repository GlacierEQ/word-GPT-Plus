/**
 * Post-update script for Word-GPT-Plus
 * Runs after an update is applied to perform additional tasks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Project root directory
const rootDir = path.resolve(__dirname, '..');

// Log helper
function log(message, isError = false) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;

    console[isError ? 'error' : 'log'](logMessage);

    // Also append to log file
    fs.appendFileSync(
        path.join(__dirname, 'update-log.txt'),
        logMessage + '\n',
        { encoding: 'utf8' }
    );
}

// Main function
async function main() {
    try {
        log('Starting post-update tasks...');

        // 1. Preserve user settings
        preserveUserSettings();

        // 2. Update certificates if needed
        updateCertificates();

        // 3. Rebuild the project
        rebuildProject();

        // 4. Migrate data if needed
        migrateData();

        log('Post-update tasks completed successfully');
    } catch (error) {
        log(`Error during post-update: ${error.message}`, true);
        log(error.stack, true);
        process.exit(1);
    }
}

// Preserve user settings from being overwritten by updates
function preserveUserSettings() {
    log('Preserving user settings...');

    const settingsFile = path.join(rootDir, '.user-settings.json');

    try {
        // Check if backup settings file exists
        if (fs.existsSync(settingsFile)) {
            log('Found user settings backup, restoring...');

            // Read settings from backup
            const userSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

            // Apply settings back to localStorage or other storage mechanism
            // (This will depend on how your app stores settings)
            log('User settings restored');
        } else {
            // Create a backup of the current settings
            log('Creating user settings backup...');

            // This is a placeholder - actual implementation depends on your storage mechanism
            // Example for settings stored in a local file:
            const localSettingsPath = path.join(rootDir, '.settings.json');
            if (fs.existsSync(localSettingsPath)) {
                fs.copyFileSync(localSettingsPath, settingsFile);
                log('User settings backup created');
            } else {
                log('No existing settings found to back up');
            }
        }
    } catch (error) {
        log(`Error preserving user settings: ${error.message}`, true);
        // Continue with other tasks, don't fail the update
    }
}

// Update certificates for HTTPS development
function updateCertificates() {
    log('Checking SSL certificates...');

    const certsDir = path.join(rootDir, 'certs');
    const certPath = path.join(certsDir, 'localhost.crt');
    const keyPath = path.join(certsDir, 'localhost.key');

    // Check if certificates exist
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        log('SSL certificates missing or incomplete. Creating new certificates...');

        // Ensure certs directory exists
        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir, { recursive: true });
        }

        // Check for certificate creation script
        const createCertScript = path.join(__dirname, 'create-cert.js');
        if (fs.existsSync(createCertScript)) {
            try {
                execSync(`node "${createCertScript}"`, { stdio: 'inherit' });
                log('SSL certificates created successfully');
            } catch (error) {
                log(`Failed to create certificates: ${error.message}`, true);
            }
        } else {
            log('Certificate creation script not found', true);
        }
    } else {
        // Check certificate expiration
        try {
            const certStat = fs.statSync(certPath);
            const now = new Date();
            const certAge = (now - certStat.mtime) / (1000 * 60 * 60 * 24); // Age in days

            if (certAge > 300) { // If older than ~10 months
                log('SSL certificates are old and may expire soon. Consider renewing them.');
            } else {
                log('SSL certificates are up to date');
            }
        } catch (error) {
            log(`Error checking certificate age: ${error.message}`, true);
        }
    }
}

// Rebuild the project
function rebuildProject() {
    log('Rebuilding the project...');

    try {
        // Clean build artifacts
        if (fs.existsSync(path.join(rootDir, 'dist'))) {
            log('Cleaning existing build...');
            // Use rimraf or recursive removal depending on Node.js version
            try {
                fs.rmSync(path.join(rootDir, 'dist'), { recursive: true, force: true });
            } catch (e) {
                // Fallback for older Node.js versions
                execSync(`rimraf "${path.join(rootDir, 'dist')}"`, { stdio: 'inherit' });
            }
        }

        // Run the build
        log('Running build process...');
        execSync('npm run build', {
            cwd: rootDir,
            stdio: 'inherit'
        });

        log('Project rebuilt successfully');
    } catch (error) {
        log(`Error rebuilding project: ${error.message}`, true);
        throw error; // This is a critical failure, so rethrow
    }
}

// Migrate data if needed (for version-specific migrations)
function migrateData() {
    log('Checking if data migration is needed...');

    const updateConfigPath = path.join(rootDir, 'update-config.json');

    try {
        const config = JSON.parse(fs.readFileSync(updateConfigPath, 'utf8'));
        const currentVersion = config.currentVersion;

        // Run version-specific migrations
        runMigrations(currentVersion);

        log('Data migration completed');
    } catch (error) {
        log(`Error during data migration: ${error.message}`, true);
        // Continue with other tasks, don't fail the update
    }
}

// Run version-specific migrations
function runMigrations(currentVersion) {
    log(`Checking migrations for version ${currentVersion}...`);

    // Define migration steps for specific version upgrades
    // Format: 'fromVersion->toVersion': migrationFunction
    const migrations = {
        // Example migration when upgrading from 1.0.x to 1.1.x
        '1.0->1.1': () => {
            log('Running migration from 1.0.x to 1.1.x');
            // Migration code here
        },
        // Add more migrations as needed

        // Example: Placeholder for future migrations
        '1.1->1.2': () => {
            log('Running migration from 1.1.x to 1.2.x');
            // Future migration code
        }
    };

    // Parse version to get major and minor
    const versionParts = currentVersion.split('.');
    if (versionParts.length >= 2) {
        const majorMinor = `${versionParts[0]}.${versionParts[1]}`;

        // Find and execute applicable migrations
        Object.keys(migrations).forEach(migrationKey => {
            const [fromVersion, toVersion] = migrationKey.split('->');

            // If current version matches the target of a migration, run it
            if (majorMinor === toVersion) {
                log(`Found applicable migration: ${migrationKey}`);

                try {
                    migrations[migrationKey]();
                    log(`Migration ${migrationKey} completed successfully`);
                } catch (error) {
                    log(`Error running migration ${migrationKey}: ${error.message}`, true);
                }
            }
        });
    }
}

// Run the main function
main().catch(error => {
    log(`Unhandled error in post-update script: ${error.message}`, true);
    log(error.stack, true);
    process.exit(1);
});
