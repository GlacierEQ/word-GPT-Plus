/**
 * Word GPT Plus - Security Protocol
 * Implements enterprise-grade security measures for data protection
 */

class SecurityProtocol {
    constructor() {
        // Security configuration
        this.config = {
            encryptionEnabled: true,
            dataMinimizationEnabled: true,
            contentScanningEnabled: true,
            securityLevel: 'enterprise' // 'basic', 'enhanced', 'enterprise'
        };

        // Encryption keys
        this.encryptionKeys = {
            local: null,
            session: null
        };

        // Security metrics
        this.securityMetrics = {
            scanResults: [],
            encryptionOperations: 0,
            securityViolations: []
        };

        // Initialize security system
        this.initialize();
    }

    /**
     * Initialize the security protocol
     */
    initialize() {
        console.log('Initializing security protocol...');

        // Load security configuration
        this.loadSecurityConfig();

        // Generate encryption keys if enabled
        if (this.config.encryptionEnabled) {
            this.generateEncryptionKeys();
        }

        // Set up content scanner if enabled
        if (this.config.contentScanningEnabled) {
            this.initializeContentScanner();
        }

        console.log(`Security protocol initialized with level: ${this.config.securityLevel}`);
    }

    /**
     * Load security configuration from storage
     */
    loadSecurityConfig() {
        try {
            const savedConfig = localStorage.getItem('wordGptPlusSecurityConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsedConfig };
            }
        } catch (error) {
            console.error('Error loading security configuration:', error);
        }
    }

    /**
     * Save security configuration to storage
     */
    saveSecurityConfig() {
        try {
            localStorage.setItem('wordGptPlusSecurityConfig', JSON.stringify(this.config));
        } catch (error) {
            console.error('Error saving security configuration:', error);
        }
    }

    /**
     * Generate encryption keys
     */
    generateEncryptionKeys() {
        try {
            // Generate a session key (this is a simplified implementation)
            // In a real system, we would use the Web Crypto API
            const sessionKeyChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let sessionKey = '';
            for (let i = 0; i < 32; i++) {
                sessionKey += sessionKeyChars.charAt(Math.floor(Math.random() * sessionKeyChars.length));
            }
            this.encryptionKeys.session = sessionKey;

            // Local key would be derived from user's password or device information
            // Here we're using a placeholder
            this.encryptionKeys.local = 'local_key_placeholder_' + Date.now();

            console.log('Encryption keys generated successfully');
        } catch (error) {
            console.error('Error generating encryption keys:', error);
            this.config.encryptionEnabled = false;
        }
    }

    /**
     * Initialize content scanner
     */
    initializeContentScanner() {
        // In a real implementation, this would set up content scanning rules
        // and potentially connect to external security services
        console.log('Content scanner initialized');
    }

    /**
     * Encrypt sensitive data
     * @param {any} data - Data to encrypt
     * @param {string} keyType - Type of key to use ('session' or 'local')
     * @returns {string} Encrypted data
     */
    encrypt(data, keyType = 'session') {
        if (!this.config.encryptionEnabled) {
            return JSON.stringify(data);
        }

        try {
            const key = this.encryptionKeys[keyType];
            if (!key) {
                throw new Error(`Encryption key not available: ${keyType}`);
            }

            // Simple encryption for demonstration
            // In a real implementation, we would use the Web Crypto API
            const dataString = JSON.stringify(data);
            const encryptedData = this.simpleEncrypt(dataString, key);

            this.securityMetrics.encryptionOperations++;
            return encryptedData;
        } catch (error) {
            console.error('Encryption error:', error);
            return JSON.stringify(data); // Fallback to unencrypted
        }
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Encrypted data
     * @param {string} keyType - Type of key to use ('session' or 'local')
     * @returns {any} Decrypted data
     */
    decrypt(encryptedData, keyType = 'session') {
        if (!this.config.encryptionEnabled) {
            return JSON.parse(encryptedData);
        }

        try {
            const key = this.encryptionKeys[keyType];
            if (!key) {
                throw new Error(`Encryption key not available: ${keyType}`);
            }

            // Simple decryption for demonstration
            const decryptedString = this.simpleDecrypt(encryptedData, key);
            this.securityMetrics.encryptionOperations++;
            return JSON.parse(decryptedString);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    /**
     * Simple encrypt function (for demonstration only)
     * @param {string} text - Text to encrypt
     * @param {string} key - Encryption key
     * @returns {string} Encrypted text (base64)
     */
    simpleEncrypt(text, key) {
        // This is a very simple XOR encryption for demonstration
        // DO NOT use this in production - use Web Crypto API instead
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result); // Convert to base64
    }

    /**
     * Simple decrypt function (for demonstration only)
     * @param {string} encryptedText - Encrypted text (base64)
     * @param {string} key - Encryption key
     * @returns {string} Decrypted text
     */
    simpleDecrypt(encryptedText, key) {
        // This is a very simple XOR decryption for demonstration
        // DO NOT use this in production - use Web Crypto API instead
        const text = atob(encryptedText); // Convert from base64
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    }

    /**
     * Scan content for security issues
     * @param {string} content - Content to scan
     * @returns {Object} Scan results
     */
    scanContent(content) {
        if (!this.config.contentScanningEnabled || !content) {
            return { safe: true, issues: [] };
        }

        try {
            const issues = [];

            // Check for potential security issues
            // This is a simplified implementation - in a real system,
            // this would use more sophisticated scanning techniques

            // Check for potential script injection
            if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
                issues.push({
                    type: 'script_injection',
                    severity: 'high',
                    description: 'Potential script injection detected'
                });
            }

            // Check for potential SQL injection
            if (/\b(select|update|delete|insert|drop|alter)\b.+\b(from|into|table)\b/gi.test(content)) {
                issues.push({
                    type: 'sql_injection',
                    severity: 'high',
                    description: 'Potential SQL injection detected'
                });
            }

            // Check for sensitive data patterns (simple check)
            if (/\b(?:\d[ -]*?){13,16}\b/g.test(content)) { // Credit card-like pattern
                issues.push({
                    type: 'sensitive_data',
                    severity: 'medium',
                    description: 'Potential credit card number detected'
                });
            }

            const result = {
                safe: issues.length === 0,
                issues: issues
            };

            // Record scan result
            this.securityMetrics.scanResults.push({
                timestamp: new Date().toISOString(),
                contentLength: content.length,
                issues: issues.length,
                issueTypes: issues.map(issue => issue.type)
            });

            // Log security violations if issues found
            if (issues.length > 0) {
                this.recordSecurityViolation('content_policy_violation', {
                    issues: issues.map(i => i.type).join(', '),
                    contentExcerpt: content.substring(0, 50) + '...'
                });
            }

            return result;
        } catch (error) {
            console.error('Content scanning error:', error);
            return { safe: false, issues: [{ type: 'scan_error', severity: 'unknown', description: error.message }] };
        }
    }

    /**
     * Apply data minimization to sensitive data
     * @param {Object} data - Data to process
     * @param {Array<string>} sensitiveFields - Fields to minimize
     * @returns {Object} Processed data
     */
    applyDataMinimization(data, sensitiveFields) {
        if (!this.config.dataMinimizationEnabled || !data) {
            return data;
        }

        try {
            const minimized = { ...data };

            sensitiveFields.forEach(field => {
                if (minimized[field] !== undefined) {
                    if (typeof minimized[field] === 'string') {
                        // Redact string content
                        minimized[field] = this.redactSensitiveString(minimized[field]);
                    } else {
                        // Remove non-string sensitive data
                        delete minimized[field];
                    }
                }
            });

            return minimized;
        } catch (error) {
            console.error('Data minimization error:', error);
            return data;
        }
    }

    /**
     * Redact a sensitive string (keep first/last characters)
     * @param {string} text - Text to redact
     * @returns {string} Redacted text
     */
    redactSensitiveString(text) {
        if (!text || text.length <= 6) {
            return '******';
        }

        const firstChars = text.substring(0, 2);
        const lastChars = text.substring(text.length - 2);
        const redactedLength = text.length - 4;
        const redacted = '*'.repeat(redactedLength);

        return `${firstChars}${redacted}${lastChars}`;
    }

    /**
     * Record a security violation
     * @param {string} type - Type of violation
     * @param {Object} details - Violation details
     */
    recordSecurityViolation(type, details) {
        const violation = {
            type,
            details,
            timestamp: new Date().toISOString()
        };

        this.securityMetrics.securityViolations.push(violation);

        // Keep only the last 100 violations
        if (this.securityMetrics.securityViolations.length > 100) {
            this.securityMetrics.securityViolations =
                this.securityMetrics.securityViolations.slice(-100);
        }

        console.warn('Security violation recorded:', violation);
    }

    /**
     * Update security configuration
     * @param {Object} newConfig - New configuration
     * @returns {Object} Updated configuration
     */
    updateSecurityConfig(newConfig) {
        const previousLevel = this.config.securityLevel;

        // Update configuration
        this.config = {
            ...this.config,
            ...newConfig
        };

        // Regenerate keys if encryption was just enabled
        if (newConfig.encryptionEnabled && !this.encryptionKeys.session) {
            this.generateEncryptionKeys();
        }

        // Initialize content scanner if just enabled
        if (newConfig.contentScanningEnabled &&
            !this.contentScannerInitialized &&
            newConfig.contentScanningEnabled !== this.contentScannerInitialized) {
            this.initializeContentScanner();
            this.contentScannerInitialized = true;
        }

        // Save updated configuration
        this.saveSecurityConfig();

        // Log security level change
        if (previousLevel !== this.config.securityLevel) {
            console.log(`Security level changed from ${previousLevel} to ${this.config.securityLevel}`);
        }

        return this.config;
    }

    /**
     * Get security metrics
     * @returns {Object} Security metrics
     */
    getSecurityMetrics() {
        return {
            ...this.securityMetrics,
            securityLevel: this.config.securityLevel,
            encryptionEnabled: this.config.encryptionEnabled,
            dataMinimizationEnabled: this.config.dataMinimizationEnabled,
            contentScanningEnabled: this.config.contentScanningEnabled,
            securityViolationCount: this.securityMetrics.securityViolations.length
        };
    }

    /**
     * Sanitize user input to prevent common attacks
     * @param {string} input - User input
     * @returns {string} Sanitized input
     */
    sanitizeUserInput(input) {
        if (!input) return '';

        // Basic HTML sanitization
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Create global instance
const securityProtocol = new SecurityProtocol();
