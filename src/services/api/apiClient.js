/**
 * Base API client with error handling and retry mechanism
 */

/**
 * Base API error class
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
        return this.message.includes('timeout') || this.message.includes('ETIMEDOUT');
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
            return `Request to ${this.provider} timed out. The service might be busy.`;
        }

        return `Error communicating with ${this.provider}: ${this.message}`;
    }
}

/**
 * Base API client class
 */
export class ApiClient {
    /**
     * Create a new API client
     * @param {Object} config - API client configuration
     * @param {string} config.baseUrl - Base URL for API
     * @param {string} config.apiKey - API key
     * @param {number} config.timeout - Request timeout in ms
     * @param {string} config.provider - Provider name
     * @param {Object} config.defaultHeaders - Default headers
     */
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.apiKey = config.apiKey;
        this.timeout = config.timeout || 60000; // Default 60 seconds
        this.provider = config.provider || 'Unknown';
        this.defaultHeaders = config.defaultHeaders || {};
    }

    /**
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {
            ...this.defaultHeaders,
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add API key if provided
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const requestOptions = {
            ...options,
            headers,
            signal: options.signal || AbortSignal.timeout(this.timeout)
        };

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorData.message || response.statusText;
                } catch {
                    errorMessage = response.statusText;
                }

                throw new ApiError(
                    errorMessage,
                    response.status,
                    this.provider,
                    {
                        endpoint,
                        method: options.method || 'GET'
                    }
                );
            }

            return await response.json();
        } catch (error) {
            // Format fetch errors and network errors as API errors
            if (!(error instanceof ApiError)) {
                error = this.formatError(error, {
                    endpoint,
                    method: options.method || 'GET'
                });
            }

            throw error;
        }
    }

    /**
     * Format errors into ApiError instances
     * @param {Error} error - Original error
     * @param {Object} requestDetails - Request details
     * @returns {ApiError} Formatted error
     */
    formatError(error, requestDetails) {
        if (error instanceof ApiError) {
            return error;
        }

        // Handle AbortError (timeout or user cancel)
        if (error.name === 'AbortError') {
            return new ApiError(
                'Request was aborted or timed out',
                0,
                this.provider,
                requestDetails
            );
        }

        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
            return new ApiError(
                'Network error - check your internet connection',
                0,
                this.provider,
                requestDetails
            );
        }

        // Default error
        return new ApiError(
            error.message || 'Unknown error',
            0,
            this.provider,
            requestDetails
        );
    }
}

/**
 * Retry a function with exponential backoff
 * @param {Function} operation - Function to retry
 * @param {Object} options - Options
 * @returns {Promise<any>} Result of operation
 */
export async function withRetry(operation, options = {}) {
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

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
