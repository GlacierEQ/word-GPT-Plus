/**
 * Utility functions for memory management and resource protection
 */

/**
 * Monitors memory usage and returns true if safe to continue
 * @returns {boolean} - Whether memory usage is at a safe level
 */
export function checkMemoryUsage() {
    try {
        // For browser environments
        if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
            const memoryInfo = window.performance.memory;
            // If using more than 80% of available heap, consider it unsafe
            if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.8) {
                console.warn('Memory usage high: ',
                    (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit * 100).toFixed(2) + '%');
                return false;
            }
            return true;
        }

        // For environments where performance.memory is not available
        // We'll return true by default but log that we can't check
        console.log('Memory usage check not available in this environment');
        return true;
    } catch (error) {
        console.error('Error checking memory usage:', error);
        // On error, assume it's safe to continue
        return true;
    }
}

/**
 * Safely limits text length based on available memory
 * @param {string} text - The text to potentially truncate
 * @param {number} maxLength - The maximum safe length
 * @returns {string} - Safely truncated text
 */
export function safelyLimitTextSize(text, maxLength = 100000) {
    if (!text) return '';

    try {
        if (typeof text !== 'string') {
            console.warn('Non-string value passed to safelyLimitTextSize');
            text = String(text);
        }

        if (text.length > maxLength) {
            console.warn(`Text exceeding safe size (${text.length} chars). Truncating to ${maxLength} chars.`);
            return text.substring(0, maxLength) + '... [Content truncated for memory safety]';
        }

        return text;
    } catch (error) {
        console.error('Error in safelyLimitTextSize:', error);
        return text ? text.toString().substring(0, 1000) : '';
    }
}

/**
 * Rate limiting mechanism
 */
export class RateLimiter {
    constructor(maxRequests = 5, perTimeWindow = 60000) {
        this.maxRequests = maxRequests;
        this.timeWindow = perTimeWindow;
        this.requestTimestamps = [];

        // Use localStorage to persist timestamps between sessions if available
        this.loadFromStorage();
    }

    /**
     * Load previous request timestamps from storage
     */
    loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const saved = window.localStorage.getItem('rateLimiter_timestamps');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Filter out any stale timestamps
                    const now = Date.now();
                    this.requestTimestamps = parsed.filter(time => (now - time) < this.timeWindow);
                }
            }
        } catch (error) {
            console.warn('Could not load rate limiter data from storage:', error);
            this.requestTimestamps = [];
        }
    }

    /**
     * Save current timestamps to storage
     */
    saveToStorage() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(
                    'rateLimiter_timestamps',
                    JSON.stringify(this.requestTimestamps)
                );
            }
        } catch (error) {
            console.warn('Could not save rate limiter data to storage:', error);
        }
    }

    /**
     * Checks if a new request can be made
     * @returns {boolean} - Whether request should be allowed
     */
    canMakeRequest() {
        const now = Date.now();

        // Clean up old timestamps
        this.requestTimestamps = this.requestTimestamps.filter(
            time => (now - time) < this.timeWindow
        );

        // Check if we're under the limit
        if (this.requestTimestamps.length < this.maxRequests) {
            this.requestTimestamps.push(now);
            this.saveToStorage();
            return true;
        }

        return false;
    }

    /**
     * Get time to wait before next request is allowed
     * @returns {number} - Time in ms to wait
     */
    getTimeToWait() {
        if (this.requestTimestamps.length === 0) return 0;

        const now = Date.now();
        const oldest = this.requestTimestamps[0];
        const timeElapsed = now - oldest;

        return Math.max(0, this.timeWindow - timeElapsed);
    }

    /**
     * Reset the rate limiter
     */
    reset() {
        this.requestTimestamps = [];
        this.saveToStorage();
    }
}

/**
 * Input validation for user prompts
 * @param {string} prompt - User input to validate
 * @returns {Object} - Validation result and sanitized prompt
 */
export function validatePrompt(prompt) {
    try {
        if (!prompt) {
            return { isValid: false, sanitized: '', error: 'Prompt is empty' };
        }

        if (typeof prompt !== 'string') {
            return { isValid: false, sanitized: '', error: 'Invalid prompt format' };
        }

        // Check for reasonable length
        if (prompt.length > 32000) {
            return {
                isValid: false,
                sanitized: prompt.substring(0, 32000),
                error: 'Prompt exceeds maximum length (32,000 characters)'
            };
        }

        // Check for minimum meaningful length
        if (prompt.trim().length < 2) {
            return {
                isValid: false,
                sanitized: prompt,
                error: 'Prompt is too short'
            };
        }

        // Sanitize input - remove potentially harmful sequences
        const sanitized = prompt
            .replace(/\<script\>.*?\<\/script\>/gis, '')
            .replace(/javascript:/gi, 'blocked:')
            .replace(/data:/gi, 'blocked-data:');

        return { isValid: true, sanitized };
    } catch (error) {
        console.error('Error validating prompt:', error);
        return { isValid: false, sanitized: '', error: 'Error during prompt validation' };
    }
}

/**
 * Times out a promise after specified duration
 * @param {Promise} promise - The promise to apply timeout to
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} - Promise that rejects on timeout
 */
export function withTimeout(promise, timeoutMs = 60000) {
    if (!promise || typeof promise.then !== 'function') {
        return Promise.reject(new Error('Invalid promise passed to withTimeout'));
    }

    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    return Promise.race([
        promise,
        timeoutPromise
    ]).finally(() => {
        clearTimeout(timeoutId);
    });
}

/**
 * Handles document size safely by estimating token counts
 * @param {string} text - Document text
 * @returns {Object} - Information about document processing safety
 */
export function documentSizeSafety(text) {
    try {
        if (!text) return { safe: true, estimatedTokens: 0, availableTokens: 100000 };

        // Make sure we have a string
        if (typeof text !== 'string') {
            text = String(text);
        }

        // Roughly estimate tokens (English averages ~4 chars per token)
        const estimatedTokens = Math.ceil(text.length / 4);

        // Safety thresholds
        const WARNING_THRESHOLD = 30000;  // 30k tokens
        const DANGER_THRESHOLD = 50000;   // 50k tokens
        const MAX_TOKENS = 100000;        // Max context size

        // Calculate available context space for response
        let safetyAssessment = {
            safe: true,
            estimatedTokens,
            warningLevel: 'none',
            availableTokens: Math.max(1000, MAX_TOKENS - estimatedTokens)
        };

        if (estimatedTokens > DANGER_THRESHOLD) {
            safetyAssessment.safe = false;
            safetyAssessment.warningLevel = 'high';
            safetyAssessment.message = 'Document too large for processing. Please select a smaller portion.';
        } else if (estimatedTokens > WARNING_THRESHOLD) {
            safetyAssessment.safe = true;
            safetyAssessment.warningLevel = 'medium';
            safetyAssessment.message = 'Large document detected. Processing may be slow.';
        }

        return safetyAssessment;
    } catch (error) {
        console.error('Error in document size safety check:', error);
        return {
            safe: false,
            estimatedTokens: 0,
            warningLevel: 'high',
            message: 'Error analyzing document size. Please try again with a smaller selection.'
        };
    }
}

/**
 * Detects and handles application errors
 * @param {Error} error - The error to handle
 * @returns {Object} User-friendly error information
 */
export function handleApplicationError(error) {
    // Default error info
    let errorInfo = {
        message: 'An unknown error occurred',
        technical: error?.message || 'No technical details available',
        severity: 'medium',
        recoverable: true,
        code: 'UNKNOWN'
    };

    if (!error) return errorInfo;

    // Network errors
    if (error.name === 'NetworkError' || error.message?.includes('network')) {
        errorInfo = {
            message: 'Network connection issue detected',
            technical: `Network error: ${error.message}`,
            severity: 'high',
            recoverable: true,
            code: 'NETWORK'
        };
    }
    // API errors
    else if (error.message?.includes('429')) {
        errorInfo = {
            message: 'API rate limit exceeded',
            technical: `Rate limit: ${error.message}`,
            severity: 'medium',
            recoverable: true,
            code: 'RATE_LIMIT'
        };
    }
    else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorInfo = {
            message: 'API authentication failed',
            technical: `Auth error: ${error.message}`,
            severity: 'high',
            recoverable: true,
            code: 'AUTH'
        };
    }
    // Memory errors
    else if (error.message?.includes('memory')) {
        errorInfo = {
            message: 'Application is low on memory',
            technical: `Memory error: ${error.message}`,
            severity: 'high',
            recoverable: false,
            code: 'MEMORY'
        };
    }

    return errorInfo;
}
