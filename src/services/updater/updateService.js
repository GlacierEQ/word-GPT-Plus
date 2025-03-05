/**
 * Update Service for Word-GPT-Plus
 * 
 * Provides functionality to check for updates from within the application
 * and initiate the update process
 */

import { getSetting, updateSetting } from '../settings/settingsManager';

// Update check interval in milliseconds (24 hours)
const DEFAULT_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

export class UpdateService {
    constructor() {
        this.isChecking = false;
        this.lastCheck = this._getLastCheckTime();
        this.currentVersion = process.env.APP_VERSION || '0.0.0';
        this.updateUrl = process.env.UPDATE_URL || 'https://api.github.com/repos/yourusername/word-gpt-plus/releases/latest';
        this.checkInterval = getSetting('system.updateCheckInterval', DEFAULT_CHECK_INTERVAL);
        this.autoUpdate = getSetting('system.autoUpdate', true);
    }

    /**
     * Get the time of the last update check
     * @returns {Date} The last check time
     */
    _getLastCheckTime() {
        const lastCheck = getSetting('system.lastUpdateCheck');
        return lastCheck ? new Date(lastCheck) : new Date(0);
    }

    /**
     * Save the time of this update check
     */
    _saveCheckTime() {
        const now = new Date().toISOString();
        updateSetting('system.lastUpdateCheck', now);
        this.lastCheck = new Date(now);
    }

    /**
     * Check if we're due for an update check
     * @returns {boolean} Whether it's time to check for updates
     */
    shouldCheckForUpdates() {
        const now = new Date();
        const timeSinceCheck = now.getTime() - this.lastCheck.getTime();
        return timeSinceCheck >= this.checkInterval;
    }

    /**
     * Check for available updates
     * @param {boolean} force Force check regardless of interval
     * @returns {Promise<Object>} Update information or null if no update
     */
    async checkForUpdates(force = false) {
        // Prevent multiple concurrent checks
        if (this.isChecking) {
            return { status: 'already-checking' };
        }

        // Check if it's time for an update check
        if (!force && !this.shouldCheckForUpdates()) {
            return {
                status: 'skipped',
                message: 'Update check was performed recently',
                nextCheckTime: new Date(this.lastCheck.getTime() + this.checkInterval)
            };
        }

        try {
            this.isChecking = true;

            // Add a user agent to avoid 403 errors from GitHub API
            const headers = {
                "User-Agent": "Word-GPT-Plus-Updater/1.0",
            };

            // Make the request
            const response = await fetch(this.updateUrl, { headers });
            if (!response.ok) {
                throw new Error(`Failed to check for updates: ${response.statusText}`);
            }

            const data = await response.json();

            // Parse version and download URL
            const latestVersion = data.tag_name?.replace('v', '') || data.name?.replace('v', '');

            if (!latestVersion) {
                throw new Error('Could not determine version from update data');
            }

            // Find download URL (prefer specific assets over zipball)
            let downloadUrl = data.zipball_url;
            if (data.assets && data.assets.length) {
                const zipAsset = data.assets.find(asset =>
                    asset.name?.endsWith('.zip') || asset.name?.includes('release')
                );

                if (zipAsset) {
                    downloadUrl = zipAsset.browser_download_url;
                }
            }

            // Save the check time
            this._saveCheckTime();

            // Compare versions
            if (this._isNewerVersion(latestVersion)) {
                return {
                    status: 'update-available',
                    currentVersion: this.currentVersion,
                    latestVersion,
                    downloadUrl,
                    releaseNotes: data.body || 'No release notes available.',
                    publishedAt: data.published_at,
                    assets: data.assets || []
                };
            }

            return {
                status: 'up-to-date',
                currentVersion: this.currentVersion,
                latestVersion
            };
        } catch (error) {
            console.error('Update check failed:', error);
            return {
                status: 'error',
                message: error.message,
                currentVersion: this.currentVersion
            };
        } finally {
            this.isChecking = false;
        }
    }

    /**
     * Compare version strings
     * @param {string} latestVersion Version to compare against current
     * @returns {boolean} Whether the latestVersion is newer
     */
    _isNewerVersion(latestVersion) {
        try {
            const current = this._parseVersion(this.currentVersion);
            const latest = this._parseVersion(latestVersion);

            // Compare major.minor.patch
            if (latest.major > current.major) return true;
            if (latest.major === current.major && latest.minor > current.minor) return true;
            if (latest.major === current.major && latest.minor === current.minor && latest.patch > current.patch) return true;

            return false;
        } catch (error) {
            console.error('Version comparison error:', error);
            // Fallback to string comparison if parsing fails
            return latestVersion !== this.currentVersion;
        }
    }

    /**
     * Parse version string into components
     * @param {string} version Version string (e.g., "1.2.3")
     * @returns {Object} Version components
     */
    _parseVersion(version) {
        const parts = version.split('.');
        return {
            major: parseInt(parts[0]) || 0,
            minor: parseInt(parts[1]) || 0,
            patch: parseInt(parts[2]) || 0
        };
    }

    /**
     * Trigger the update process
     * This launches the external updater process
     * @returns {Promise<boolean>} Success status
     */
    async triggerUpdate() {
        try {
            // Store that we're updating
            updateSetting('system.updateInProgress', true);

            // Use Office.js Dialog API to show update options
            if (typeof Office !== 'undefined' && Office.context && Office.context.ui) {
                Office.context.ui.displayDialogAsync(
                    `${window.location.origin}/update-dialog.html`,
                    { height: 40, width: 30, displayInIframe: true },
                    result => {
                        if (result.status === Office.AsyncResultStatus.Failed) {
                            console.error('Could not open update dialog:', result.error.message);
                        }
                    }
                );
                return true;
            }

            // Fallback for direct browser use
            if (window.confirm('An update is available for Word-GPT-Plus. Would you like to update now?')) {
                window.open('https://github.com/yourusername/word-gpt-plus/releases/latest', '_blank');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error triggering update:', error);
            return false;
        } finally {
            // Make sure to clear the update in progress flag
            updateSetting('system.updateInProgress', false);
        }
    }
}

// Create singleton instance
export const updateService = new UpdateService();