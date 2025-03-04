/**
 * Utilities for handling security-related functions
 */

/**
 * Generate a browser fingerprint for local key derivation
 * @returns {Promise<string>} Browser fingerprint
 */
export async function generateBrowserFingerprint() {
    try {
        // Collect browser-specific information
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.deviceMemory,
            navigator.hardwareConcurrency,
            !!navigator.bluetooth,
            !!navigator.credentials,
            !!navigator.geolocation,
            !!navigator.mediaDevices
        ]
            .filter(item => item !== undefined)
            .join('|');

        // Create hash of the components
        const encoder = new TextEncoder();
        const data = encoder.encode(components);

        // Use Web Crypto API to create a digest
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

        // Convert to hex string
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    } catch (e) {
        console.error('Error generating fingerprint:', e);
        // Fall back to a simpler fingerprint
        return btoa(navigator.userAgent + navigator.language).slice(0, 32);
    }
}

/**
 * Encrypt sensitive data for local storage
 * @param {string} data - Data to encrypt
 * @returns {Promise<Object>} Encrypted data object
 */
export async function encryptData(data) {
    try {
        // Generate encryption key from browser fingerprint
        const fingerprint = await generateBrowserFingerprint();
        const encoder = new TextEncoder();
        const keyData = encoder.encode(fingerprint);

        // Import key for encryption
        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        // Generate random IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // Encrypt the data
        const dataBuffer = encoder.encode(data);
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            cryptoKey,
            dataBuffer
        );

        // Format for storage
        return {
            v: 1, // Format version
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encryptedBuffer))
        };
    } catch (e) {
        console.error('Error encrypting data:', e);
        // Fall back to base64 encoding (not secure, but better than plaintext)
        return {
            v: 0, // Indicates fallback encoding
            data: btoa(data)
        };
    }
}

/**
 * Decrypt data from local storage
 * @param {Object} encryptedData - Encrypted data object 
 * @returns {Promise<string>} Decrypted data
 */
export async function decryptData(encryptedData) {
    try {
        // Check format version
        if (!encryptedData || encryptedData.v === 0) {
            // Handle fallback encoding
            return atob(encryptedData.data);
        }

        // Generate decryption key from browser fingerprint
        const fingerprint = await generateBrowserFingerprint();
        const encoder = new TextEncoder();
        const keyData = encoder.encode(fingerprint);

        // Import key for decryption
        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Convert arrays back to Uint8Arrays
        const iv = new Uint8Array(encryptedData.iv);
        const data = new Uint8Array(encryptedData.data);

        // Decrypt the data
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv
            },
            cryptoKey,
            data
        );

        // Convert back to string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (e) {
        console.error('Error decrypting data:', e);
        throw new Error('Failed to decrypt data. This could happen if trying to access from a different browser or after clearing browsing data.');
    }
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
    if (!input) return '';

    return input
        // Remove script tags and their content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers
        .replace(/\s*on\w+\s*=\s*["']?[^"']*["']?/gi, '')
        // Replace < and > with their HTML entities
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
