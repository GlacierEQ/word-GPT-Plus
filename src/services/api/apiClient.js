/**
 * Base API client for all external API communications
 */
export class ApiClient {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || '';
        this.apiKey = config.apiKey || null;
        this.defaultHeaders = config.headers || {};
        this.timeout = config.timeout || 60000; // 60 second default timeout
    }

    /**
     * Make an API request with proper error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     * @throws {ApiError} Standardized API error
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...this.defaultHeaders,
            ...options.headers
        };

        if (this.apiKey && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(
                    errorData.error?.message || `Request failed with status: ${response.status}`,
                    response.status,
                    this.constructor.name.replace('Client', ''),
                    {
                        endpoint,
                        requestBody: options.body,
                        responseData: errorData
                    }
                );
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new ApiError(
                    'Request timed out',
                    408,
                    this.constructor.name.replace('Client', ''),
                    { endpoint }
                );
            }

            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError(
                error.message,
                0,
                this.constructor.name.replace('Client', ''),
                { endpoint }
            );
        }
    }

    /**
     * Set the API key
     * @param {string} apiKey - The API key to use
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Set request timeout
     * @param {number} timeout - Timeout in milliseconds
     */
    setTimeout(timeout) {
        this.timeout = timeout;
    }
}

/**
 * Standardized API error
 */
export class ApiError extends Error {
    constructor(message, statusCode, provider, requestInfo = {}) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.provider = provider;
        this.requestInfo = requestInfo;
        this.timestamp = new Date();
    }

    isAuthError() {
        return this.statusCode === 401 || this.statusCode === 403;
    }

    isRateLimitError() {
        return this.statusCode === 429;
    }

    isServerError() {
        return this.statusCode >= 500;
    }

    isTimeout() {
        return this.statusCode === 408;
    }

    isNetworkError() {
        return this.statusCode === 0;
    }

    get displayMessage() {
        return this.getUserFriendlyMessage();
    }

    getUserFriendlyMessage() {
        if (this.isAuthError()) {
            return `Authentication failed with ${this.provider}. Please check your API key.`;
        }

        if (this.isRateLimitError()) {
            return `Rate limit exceeded for ${this.provider}. Please try again later.`;
        }

        if (this.isServerError()) {
            return `${this.provider} server error. The service might be experiencing issues.`;
        }

        if (this.isTimeout()) {
            return `Request to ${this.provider} timed out. Please check your internet connection.`;
        }

        if (this.isNetworkError()) {
            return `Network error when connecting to ${this.provider}. Please check your internet connection.`;
        }

        return `Error communicating with ${this.provider}: ${this.message}`;
    }
}

/**
 * Exponential backoff retry mechanism
 * @param {Function} operation - Async operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Operation result
 */
export const withRetry = async (operation, options = {}) => {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        shouldRetry = (error) => error.isServerError() || error.isRateLimitError()
    } = options;

    let attempt = 0;

    while (true) {
        try {
            attempt++;
            return await operation(attempt);
        } catch (error) {
            if (attempt >= maxRetries || !shouldRetry(error)) {
                throw error;
            }

            // Calculate delay with exponential backoff and jitter
            const delay = Math.min(
                baseDelay * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4),
                maxDelay
            );

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

/**
 * Generic API client interface for different AI providers
 */

import { withRetry } from '../../utils/errorHandler';
import { startTiming, endTiming } from '../../utils/timing';
