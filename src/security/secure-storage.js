/**
 * Word GPT Plus - Secure Storage
 * Provides encrypted storage for sensitive information like API keys
 */

class SecureStorage {
    constructor() {
        this.prefix = 'word_gpt_plus_secure_';
        this.initialized = false;
        this.encryptionKey = null;
        this.encryptionEnabled = true;

        // Check if crypto is available
        if (typeof window.crypto === 'undefined' ||
            typeof window.crypto.subtle === 'undefined') {
            console.warn('Web Crypto API not available. Encryption disabled.');
            this.encryptionEnabled = false;
        }
    }

    /**
     * Initialize secure storage with an encryption key
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        if (this.initialized) return true;

        try {
            // Generate or retrieve encryption key
            if (this.encryptionEnabled) {
                this.encryptionKey = await this._getEncryptionKey();
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize secure storage:', error);
            return false;
        }
    }

    /**
     * Store a sensitive value securely
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {Promise<boolean>} Success status
     */
    async setItem(key, value) {
        if (!this.initialized) await this.initialize();

        try {
            // Convert value to string if needed
            const valueStr = typeof value !== 'string' ? JSON.stringify(value) : value;

            // Encrypt if enabled, otherwise store directly
            if (this.encryptionEnabled && this.encryptionKey) {
                const encryptedValue = await this._encrypt(valueStr);
                localStorage.setItem(this.prefix + key, encryptedValue);
            } else {
                localStorage.setItem(this.prefix + key, valueStr);
            }

            return true;
        } catch (error) {
            console.error(`Failed to securely store ${key}:`, error);
            return false;
        }
    }

    /**
     * Retrieve a securely stored value
     * @param {string} key - Storage key
     * @returns {Promise<string|null>} Retrieved value
     */
    async getItem(key) {
        if (!this.initialized) await this.initialize();

        try {
            const storedValue = localStorage.getItem(this.prefix + key);
            if (!storedValue) return null;

            // Decrypt if encryption is enabled
            if (this.encryptionEnabled && this.encryptionKey) {
                return await this._decrypt(storedValue);
            } else {
                return storedValue;
            }
        } catch (error) {
            console.error(`Failed to retrieve ${key}:`, error);
            return null;
        }
    }

    /**
     * Remove a stored item
     * @param {string} key - Storage key
     */
    removeItem(key) {
        localStorage.removeItem(this.prefix + key);
    }

    /**
     * Clear all securely stored items
     */
    clear() {
        // Remove only items with our prefix
        Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .forEach(key => localStorage.removeItem(key));
    }

    /**
     * Get or create encryption key
     * @returns {Promise<CryptoKey>} The encryption key
     * @private
     */
    async _getEncryptionKey() {
        try {
            // Check if we have a stored key identifier
            const keyId = localStorage.getItem(`${this.prefix}key_id`);

            if (keyId) {
                // Try to retrieve existing key from session storage
                const sessionKey = sessionStorage.getItem(`${this.prefix}session_key`);
                if (sessionKey) {
                    // Import the key from session storage
                    const rawKey = new Uint8Array(JSON.parse(sessionKey));
                    return await window.crypto.subtle.importKey(
                        'raw',
                        rawKey,
                        { name: 'AES-GCM', length: 256 },
                        false,
                        ['encrypt', 'decrypt']
                    );
                }
            }

            // Generate a new key if none exists
            const newKey = await window.crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,  // extractable
                ['encrypt', 'decrypt']
            );

            // Export and store the key for this session
            const exportedKey = await window.crypto.subtle.exportKey('raw', newKey);
            const keyArray = Array.from(new Uint8Array(exportedKey));
            sessionStorage.setItem(`${this.prefix}session_key`, JSON.stringify(keyArray));

            // Create and store a new key identifier
            const newKeyId = this._generateId();
            localStorage.setItem(`${this.prefix}key_id`, newKeyId);

            return newKey;
        } catch (error) {
            console.error('Error getting encryption key:', error);
            throw error;
        }
    }

    /**
     * Generate a random identifier
     * @returns {string} Random ID
     * @private
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Encrypt a string value
     * @param {string} value - Value to encrypt
     * @returns {Promise<string>} Encrypted value as base64
     * @private
     */
    async _encrypt(value) {
        try {
            // Create an initialization vector
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Encode the value to encrypt
            const data = new TextEncoder().encode(value);

            // Encrypt the data
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                this.encryptionKey,
                data
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);

            // Convert to base64 for storage
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption error:', error);
            throw error;
        }
    }

    /**
     * Decrypt a stored value
     * @param {string} encryptedValue - Base64 encrypted value
     * @returns {Promise<string>} Decrypted value
     * @private
     */
    async _decrypt(encryptedValue) {
        try {
            // Convert from base64 to array buffer
            const encryptedData = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0));

            // Extract the IV (first 12 bytes)
            const iv = encryptedData.slice(0, 12);

            // Extract the encrypted data (everything after IV)
            const dataToDecrypt = encryptedData.slice(12);

            // Decrypt the data
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                this.encryptionKey,
                dataToDecrypt
            );

            // Decode and return the decrypted data
            return new TextDecoder().decode(decryptedBuffer);
        } catch (error) {
            console.error('Decryption error:', error);
            throw error;
        }
    }
}

// Create global instance
const secureStorage = new SecureStorage();

export default secureStorage;
