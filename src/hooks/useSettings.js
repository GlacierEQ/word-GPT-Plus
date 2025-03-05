import { useState, useEffect, useCallback, useContext } from 'react';
import { SettingsManager, SettingsSchema } from '../services/settings/settingsManager';
import { SettingsContext } from '../context/SettingsContext';

// Create a singleton instance of the settings manager
const settingsManager = new SettingsManager(SettingsSchema);

/**
 * Custom hook for accessing and managing application settings
 * @returns {Object} Settings management utilities
 */
export function useSettings() {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }

    return context;
}

/**
 * Utility to get a specific setting directly (for non-React code)
 * @param {string} path - Setting path in dot notation (e.g., 'features.memoryEnabled')
 * @param {any} defaultValue - Default value if setting doesn't exist
 * @returns {any} The setting value
 */
export function getSetting(path, defaultValue = null) {
    // Extract category and key from path
    const [category, key] = path.split('.');

    try {
        // Try to get from localStorage
        const categoryData = localStorage.getItem(`settings_${category}`);
        if (!categoryData) return defaultValue;

        const settings = JSON.parse(categoryData);
        return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
        console.error(`Error getting setting: ${path}`, error);
        return defaultValue;
    }
}

/**
 * Utility to update a specific setting directly (for non-React code)
 * @param {string} path - Setting path in dot notation (e.g., 'features.memoryEnabled')
 * @param {any} value - Value to store
 * @returns {boolean} Success status
 */
export function updateSetting(path, value) {
    // Extract category and key from path
    const [category, key] = path.split('.');

    try {
        // Get current settings for this category
        const categoryKey = `settings_${category}`;
        const categoryData = localStorage.getItem(categoryKey);
        const settings = categoryData ? JSON.parse(categoryData) : {};

        // Update the setting
        settings[key] = value;

        // Save back to localStorage
        localStorage.setItem(categoryKey, JSON.stringify(settings));

        return true;
    } catch (error) {
        console.error(`Error updating setting: ${path}`, error);
        return false;
    }
}
