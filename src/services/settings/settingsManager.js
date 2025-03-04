/**
 * Settings management system for Word-GPT-Plus
 */
import { encryptData, decryptData } from '../../utils/security';

// Schema definition for settings
export const SettingsSchema = {
    apiKeys: {
        openai: { type: 'string', sensitive: true },
        azure: { type: 'string', sensitive: true },
        deepseek: { type: 'string', sensitive: true },
        gemini: { type: 'string', sensitive: true },
        groq: { type: 'string', sensitive: true }
    },
    endpoints: {
        deepseek: { type: 'string', default: 'https://api.deepseek.com/v1' },
        ollama: { type: 'string', default: 'http://localhost:11434/api' }
    },
    models: {
        preferredTextModel: { type: 'string', default: 'gpt-4' },
        preferredImageModel: { type: 'string', default: 'deepseek-vl-2.0-base' }
    },
    features: {
        memoryEnabled: { type: 'boolean', default: true },
        contextualAwareness: { type: 'boolean', default: true },
        errorDetection: { type: 'boolean', default: true }
    },
    usage: {
        deepseekNonCommercial: { type: 'boolean', default: false },
        useSeperateDeepseekKey: { type: 'boolean', default: false },
        embedModelEnabled: { type: 'boolean', default: true },
        ollamaEnabled: { type: 'boolean', default: false }
    },
    security: {
        storeKeysInMemoryOnly: { type: 'boolean', default: false },
        encryptStoredKeys: { type: 'boolean', default: true }
    }
};

/**
 * Settings Manager class for handling application settings
 */
export class SettingsManager {
    constructor(schema = SettingsSchema, storage = localStorage) {
        this.schema = schema;
        this.storage = storage;
        this.memoryOnlySettings = new Map();
    }

    /**
     * Retrieve a setting by key path
     * @param {string} keyPath - Dot-notation path to setting
     * @param {any} defaultValue - Default value if setting not found
     * @returns {any} Setting value
     */
    get(keyPath, defaultValue = null) {
        const [category, key] = keyPath.split('.');

        // Check memory-only settings first
        if (this.memoryOnlySettings.has(keyPath)) {
            return this.memoryOnlySettings.get(keyPath);
        }

        try {
            // Get schema info
            const schemaItem = this.schema[category]?.[key];

            // If key doesn't exist in schema, return default
            if (!schemaItem) return defaultValue;

            // Get stored value
            const categoryData = this.storage.getItem(category);
            if (!categoryData) {
                return schemaItem.default !== undefined ? schemaItem.default : defaultValue;
            }

            const parsedData = JSON.parse(categoryData);

            // If key doesn't exist in stored data
            if (parsedData[key] === undefined) {
                return schemaItem.default !== undefined ? schemaItem.default : defaultValue;
            }

            // For sensitive data, decrypt if needed
            if (schemaItem.sensitive && parsedData[key]?.encrypted) {
                return this.decryptValue(parsedData[key].data);
            }

            return parsedData[key];
        } catch (e) {
            console.error('Error retrieving setting:', e);

            // Try to get schema default, otherwise return provided default
            const schemaDefault = this.schema[category]?.[key]?.default;
            return schemaDefault !== undefined ? schemaDefault : defaultValue;
        }
    }

    /**
     * Save a setting value
     * @param {string} keyPath - Dot-notation path to setting
     * @param {any} value - Value to store
     * @param {boolean} persistToStorage - Whether to save to persistent storage
     * @returns {boolean} Success status
     */
    set(keyPath, value, persistToStorage = true) {
        const [category, key] = keyPath.split('.');

        // Validate against schema
        if (!this.schema[category] || !this.schema[category][key]) {
            console.warn(`Setting ${keyPath} not defined in schema`);
            return false;
        }

        // Check if this should be memory-only
        const storeInMemoryOnly =
            this.get('security.storeKeysInMemoryOnly') &&
            this.schema[category][key].sensitive;

        if (storeInMemoryOnly || !persistToStorage) {
            this.memoryOnlySettings.set(keyPath, value);
            return true;
        }

        try {
            // Get current category data
            const categoryData = this.storage.getItem(category);
            const parsedData = categoryData ? JSON.parse(categoryData) : {};

            // Process value based on schema
            if (this.schema[category][key].sensitive && this.get('security.encryptStoredKeys')) {
                parsedData[key] = {
                    encrypted: true,
                    data: this.encryptValue(value)
                };
            } else {
                parsedData[key] = value;
            }

            // Store back to storage
            this.storage.setItem(category, JSON.stringify(parsedData));
            return true;
        } catch (e) {
            console.error('Error saving setting:', e);
            return false;
        }
    }

    /**
     * Get all settings
     * @returns {Object} All settings grouped by category
     */
    getAll() {
        const settings = {};

        // Process each category from schema
        Object.keys(this.schema).forEach(category => {
            settings[category] = {};

            // Process each key in category
            Object.keys(this.schema[category]).forEach(key => {
                settings[category][key] = this.get(`${category}.${key}`);
            });
        });

        return settings;
    }

    /**
     * Encrypt a value
     * @param {any} value - Value to encrypt
     * @returns {string} Encrypted value
     */
    encryptValue(value) {
        return encryptData(value);
    }

    /**
     * Decrypt a value
     * @param {string} encryptedValue - Encrypted value to decrypt
     * @returns {any} Decrypted value
     */
    decryptValue(encryptedValue) {
        return decryptData(encryptedValue);
    }
}