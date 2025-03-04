import React, { createContext, useContext, useState, useEffect } from 'react';
import { SettingsManager, SettingsSchema } from '../services/settings/settingsManager';

// Initialize settings manager
const settingsManager = new SettingsManager(SettingsSchema);

// Create settings context
const SettingsContext = createContext();

/**
 * Provider component for application settings
 */
export function SettingsProvider({ children }) {
    // Get initial settings
    const getInitialSettings = () => {
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
    };

    // State for settings
    const [settings, setSettings] = useState(getInitialSettings);
    const [isLoading, setIsLoading] = useState(true);

    // Update setting by path
    const updateSetting = (path, value, persist = true) => {
        // Split path into parts (e.g., 'apiKeys.openai' -> ['apiKeys', 'openai'])
        const parts = path.split('.');
        if (parts.length !== 2) {
            console.error('Invalid setting path, expected format: category.key');
            return;
        }

        const [category, key] = parts;

        // Save to settings manager (handles persistence)
        settingsManager.set(path, value, persist);

        // Update state
        setSettings(prevSettings => ({
            ...prevSettings,
            [category]: {
                ...prevSettings[category],
                [key]: value
            }
        }));
    };

    // Export settings to JSON
    const exportSettings = () => {
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
    };

    // Import settings from JSON
    const importSettings = (jsonString) => {
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
    };

    // Reset settings to defaults
    const resetSettings = () => {
        Object.keys(SettingsSchema).forEach(category => {
            Object.keys(SettingsSchema[category]).forEach(key => {
                if (SettingsSchema[category][key].default !== undefined) {
                    updateSetting(`${category}.${key}`, SettingsSchema[category][key].default);
                }
            });
        });
    };

    // Initialize settings
    useEffect(() => {
        // Any initialization logic could go here
        setIsLoading(false);
    }, []);

    // Context value
    const contextValue = {
        settings,
        isLoading,
        updateSetting,
        exportSettings,
        importSettings,
        resetSettings
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
}

/**
 * Hook for accessing settings context
 * @returns {Object} Settings context
 */
export function useSettings() {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }

    return context;
}
