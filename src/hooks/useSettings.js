import { useState, useEffect, useCallback } from 'react';
import { SettingsManager, SettingsSchema } from '../services/settings/settingsManager';

// Create a singleton instance of the settings manager
const settingsManager = new SettingsManager(SettingsSchema);

/**
 * Custom hook for accessing and managing application settings
 * @returns {Object} Settings management utilities
 */
export function useSettings() {
    const [settings, setSettings] = useState(() => getInitialSettings());

    // Get initial settings from manager
    function getInitialSettings() {
        const initialSettings = {};

        // Process each category from schema
        Object.keys(SettingsSchema).forEach(category => {
            initialSettings[category] = {};

            // Process each key in category
            Object.keys(SettingsSchema[category]).forEach(key => {
                initialSettings[category][key] = settingsManager.get(`${category}.${key}`);
            });
        });

        return initialSettings;
    }

    // Update a single setting by path
    const updateSetting = useCallback((path, value, persist = true) => {
        setSettings(prevSettings => {
            // Split path into parts (e.g., 'apiKeys.openai' -> ['apiKeys', 'openai'])
            const parts = path.split('.');
            if (parts.length !== 2) {
                console.error('Invalid setting path, expected format: category.key');
                return prevSettings;
            }

            const [category, key] = parts;

            // Save to settings manager (handles persistence)
            settingsManager.set(path, value, persist);

            // Update local state
            return {
                ...prevSettings,
                [category]: {
                    ...prevSettings[category],
                    [key]: value
                }
            };
        });
    }, []);

    // Export/import all settings
    const exportSettings = useCallback(() => {
        const exported = { ...settings };

        // Remove sensitive data
        Object.keys(SettingsSchema).forEach(category => {
            Object.keys(SettingsSchema[category]).forEach(key => {
                if (SettingsSchema[category][key].sensitive) {
                    if (!exported[category]) exported[category] = {};
                    exported[category][key] = '[REDACTED]';
                }
            });
        });

        return JSON.stringify(exported, null, 2);
    }, [settings]);

    const importSettings = useCallback((jsonString) => {
        try {
            const imported = JSON.parse(jsonString);

            // Validate and import each setting
            Object.keys(imported).forEach(category => {
                if (!SettingsSchema[category]) return;

                Object.keys(imported[category]).forEach(key => {
                    if (!SettingsSchema[category][key]) return;

                    // Skip sensitive data with placeholder values
                    if (SettingsSchema[category][key].sensitive &&
                        imported[category][key] === '[REDACTED]') return;

                    // Import valid setting
                    const path = `${category}.${key}`;
                    updateSetting(path, imported[category][key]);
                });
            });

            return true;
        } catch (e) {
            console.error('Error importing settings:', e);
            return false;
        }
    }, [updateSetting]);

    // Reset settings to defaults
    const resetSettings = useCallback(() => {
        Object.keys(SettingsSchema).forEach(category => {
            Object.keys(SettingsSchema[category]).forEach(key => {
                if (SettingsSchema[category][key].default !== undefined) {
                    updateSetting(`${category}.${key}`, SettingsSchema[category][key].default);
                }
            });
        });
    }, [updateSetting]);

    return {
        settings,
        updateSetting,
        exportSettings,
        importSettings,
        resetSettings
    };
}
