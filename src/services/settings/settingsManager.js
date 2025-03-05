/**
 * Settings Manager for Word-GPT-Plus
 * 
 * Provides functionality to get, set, and manage user settings
 * with persistence across browser sessions
 */

// Default settings
const DEFAULT_SETTINGS = {
    apiKeys: {
        openai: '',
        deepseek: '',
        anthropic: '',
        groq: '',
        azure: ''
    },
    models: {
        preferredTextModel: 'gpt-4',
        preferredImageModel: 'deepseek-vl-2.0-base'
    },
    usage: {
        deepseekNonCommercial: true,
        useSeperateDeepseekKey: false,
        deepseekEndpoint: 'https://api.deepseek.com/v1',
        embedModelEnabled: true
    },
    generation: {
        temperature: 0.7,
        maxTokens: 2048,
        contextSize: 3
    },
    memory: {
        enabled: true,
        promptIncludeCount: 3
    },
    features: {
        contextualAwareness: true,
        errorDetection: true,
        autoPromptEnhancement: true
    },
    system: {
        lastUpdateCheck: null,
        updateCheckInterval: 86400000, // 24 hours in ms
        autoUpdate: true,
        telemetry: false,
        updateInProgress: false
    },
    ui: {
        theme: 'light',
        fontSize: 14,
        expandedSettings: false,
        showAdvancedOptions: false
    }
};

// Sensitive keys that should be handled with extra care
const SENSITIVE_KEYS = [
    'apiKeys.openai',
    'apiKeys.anthropic',
    'apiKeys.deepseek',
    'apiKeys.azure',
    'apiKeys.groq'
];

/**
 * Get the current settings storage
 * @returns {Object} Storage interface
 */
function getStorage() {
    // For browser environments, use localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
    }

    // Fallback for server-side or testing
    const memoryStorage = {};
    return {
        getItem: key => memoryStorage[key] || null,
        setItem: (key, value) => {
            memoryStorage[key] = value;
        },
        removeItem: key => {
            delete memoryStorage[key];
        }
    };
}

/**
 * Get a setting by its path
 * @param {string} path - The dot-notation path to the setting
 * @param {*} defaultValue - Default value if not found
 * @returns {*} The setting value
 */
export function getSetting(path, defaultValue = null) {
    try {
        const storage = getStorage();
        const pathParts = path.split('.');
        const topLevelKey = pathParts[0];

        // Get the top-level object
        const storedValue = storage.getItem(`word-gpt-plus.${topLevelKey}`);
        if (!storedValue) {
            // Check if there's a default
            return getDefaultSetting(path, defaultValue);
        }

        // Parse stored value
        const parsedValue = JSON.parse(storedValue);

        // Return entire object if no further path parts
        if (pathParts.length === 1) {
            return parsedValue;
        }

        // Traverse the object path
        let current = parsedValue;
        for (let i = 1; i < pathParts.length; i++) {
            if (current === undefined || current === null) {
                return getDefaultSetting(path, defaultValue);
            }
            current = current[pathParts[i]];
        }

        // Return value or default
        return current !== undefined ? current : getDefaultSetting(path, defaultValue);
    } catch (error) {
        console.error(`Error getting setting at path "${path}":`, error);
        return getDefaultSetting(path, defaultValue);
    }
}

/**
 * Get a setting from defaults
 * @param {string} path - The dot-notation path to the setting
 * @param {*} fallback - Fallback value if not in defaults
 * @returns {*} The default value
 */
function getDefaultSetting(path, fallback = null) {
    try {
        const pathParts = path.split('.');

        let current = DEFAULT_SETTINGS;
        for (const part of pathParts) {
            if (current === undefined || current === null) {
                return fallback;
            }
            current = current[part];
        }

        return current !== undefined ? current : fallback;
    } catch (error) {
        return fallback;
    }
}

/**
 * Update a setting by its path
 * @param {string} path - The dot-notation path to the setting
 * @param {*} value - New value to set
 * @returns {boolean} Success status
 */
export function updateSetting(path, value) {
    try {
        const storage = getStorage();
        const pathParts = path.split('.');
        const topLevelKey = pathParts[0];

        // Handle sensitive data
        if (SENSITIVE_KEYS.includes(path)) {
            // You could add encryption here
            console.log('Storing sensitive data for path:', path);
        }

        // Get current stored value for this top level
        const currentStored = storage.getItem(`word-gpt-plus.${topLevelKey}`);
        let currentValue = currentStored ? JSON.parse(currentStored) : {};

        // If it's just the top level, replace the object
        if (pathParts.length === 1) {
            currentValue = value;
        } else {
            // Traverse and update nested property
            let current = currentValue;
            for (let i = 1; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                if (!current[part] || typeof current[part] !== 'object') {
                    current[part] = {};
                }
                current = current[part];
            }

            // Set the value at the final path
            current[pathParts[pathParts.length - 1]] = value;
        }

        // Store the updated value
        storage.setItem(`word-gpt-plus.${topLevelKey}`, JSON.stringify(currentValue));

        // Trigger update event for reactive components
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('word-gpt-plus-settings-changed', {
                detail: { path, value }
            });
            window.dispatchEvent(event);
        }

        return true;
    } catch (error) {
        console.error(`Error updating setting at path "${path}":`, error);
        return false;
    }
}