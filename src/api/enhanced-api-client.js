/**
 * Word GPT Plus - Enhanced API Client
 * Secure implementation of API client with best practices for security
 */

import errorHandler from '../utils/error-handler';
import logger from '../utils/logger';
import secureStorage from '../security/secure-storage';
import contentScanner from '../security/content-scanner';
import config from '../config';

// Create a logger for API operations
const apiLogger = logger.createContextLogger('API');

class EnhancedApiClient {
    constructor() {
        this.providers = config.api.providers || {};
        this.defaultProvider = config.api.defaultProvider || 'openai';
        this.timeout = config.api.requestTimeout || 60000;
        this.retryConfig = {
            maxRetries: config.api.retries || 3,
            initialDelay: 1000,
            backoffFactor: 2
        };

        // Use secure rate limiters for each provider
        this.rateLimiters = {};

        // Initialize
        this._initializeRateLimiters();
    }

    /**
     * Initialize rate limiters for each provider
     * @private
     */
    _initializeRateLimiters() {
        Object.keys(this.providers).forEach(provider => {
            this.rateLimiters[provider] = {
                tokens: 0,
                lastRefill: Date.now(),
                tokensPerMinute: provider === 'openai' ? 10000 : 5000 // Default values
            };
        });
    }

    /**
     * Set API key for provider securely
     * @param {string} provider - Provider name
     * @param {string} apiKey - API key
     * @returns {Promise<boolean>} Success status
     */
    async setApiKey(provider, apiKey) {
        try {
            provider = provider.toLowerCase();
            // Store API key securely
            await secureStorage.setItem(`${provider}_api_key`, apiKey);

            apiLogger.info(`API key set for provider: ${provider}`);
            return true;
        } catch (error) {
            apiLogger.error(`Failed to set API key for ${provider}`, { error });
            errorHandler.handleError(error, errorHandler.categories.SECURITY);
            return false;
        }
    }

    /**
     * Get API key for provider
     * @param {string} provider - Provider name
     * @returns {Promise<string|null>} API key
     */
    async getApiKey(provider) {
        try {
            provider = provider.toLowerCase();
            return await secureStorage.getItem(`${provider}_api_key`);
        } catch (error) {
            apiLogger.error(`Failed to get API key for ${provider}`, { error });
            return null;
        }
    }

    /**
     * Get base URL for provider
     * @param {string} provider - Provider name
     * @returns {string|null} Base URL
     */
    getBaseUrl(provider) {
        provider = provider.toLowerCase();
        return this.providers[provider]?.baseUrl || null;
    }

    /**
     * Execute API request with security best practices
     * @param {string} provider - Provider name
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @param {number} estimatedTokens - Estimated token usage
     * @param {number} [currentRetry=0] - Current retry attempt
     * @returns {Promise<Object>} API response
     */
    async executeRequest(provider, endpoint, params, estimatedTokens, currentRetry = 0) {
        try {
            // Check for sensitive content before sending
            if (params.messages && config.security.contentScanningEnabled) {
                const contentCheck = await this._checkContentSensitivity(params);
                if (contentCheck.isSensitive) {
                    throw new Error(`Content contains sensitive information: ${contentCheck.reason}`);
                }
            }

            apiLogger.debug(`Starting API request to ${provider}${endpoint}`, {
                provider,
                endpoint,
                estimatedTokens
            });

            // Record start time for performance tracking
            const startTime = performance.now();

            // Get base URL
            const baseUrl = this.getBaseUrl(provider);

            if (!baseUrl) {
                throw new Error(`Invalid base URL for provider: ${provider}`);
            }

            // Build URL
            const url = baseUrl + endpoint;

            // Get API key securely
            const apiKey = await this.getApiKey(provider);

            if (!apiKey && provider !== 'localServer') {
                throw new Error(`API key not found for provider: ${provider}`);
            }

            // Check rate limits
            if (!this._checkRateLimit(provider, estimatedTokens)) {
                throw new Error(`Rate limit exceeded for ${provider}. Please try again later.`);
            }

            // Prepare headers with security best practices
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add authorization header based on provider
            if (provider === 'openai') {
                headers['Authorization'] = `Bearer ${apiKey}`;
            } else if (provider === 'azure') {
                headers['api-key'] = apiKey;
            }

            // Add request ID for tracing
            headers['X-Request-ID'] = this._generateRequestId();

            // Make the request
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(params),
                signal: AbortSignal.timeout(this.timeout),
                // Credentials: never include cookies
                credentials: 'omit'
            });

            // Calculate response time
            const responseTime = performance.now() - startTime;

            // Log performance data
            apiLogger.debug(`Received response in ${responseTime.toFixed(2)}ms`, {
                status: response.status,
                responseTime,
                provider,
                requestId: headers['X-Request-ID']
            });

            // Check for HTTP errors
            if (!response.ok) {
                let errorData;

                // Safely parse error response
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: 'Invalid JSON response' };
                }

                // Create a structured error object
                const error = new Error(errorData.error?.message || 'API request failed');
                error.status = response.status;
                error.statusText = response.statusText;
                error.data = errorData;
                error.provider = provider;
                error.endpoint = endpoint;
                error.requestId = headers['X-Request-ID'];

                // Handle error with the error handler
                errorHandler.handleError(error, errorHandler.categories.API, {
                    provider,
                    endpoint,
                    status: response.status,
                    statusText: response.statusText,
                    requestId: headers['X-Request-ID']
                });

                throw error;
            }

            // Securely parse response
            let data;
            try {
                data = await response.json();
            } catch (error) {
                throw new Error('Invalid response format from API');
            }

            // Validate response structure
            if (!this._validateResponse(data, provider)) {
                throw new Error('Invalid or unexpected response structure');
            }

            // Record API usage for rate limiting
            this._recordApiUsage(provider, this._calculateActualTokenUsage(data, estimatedTokens));

            // Log success (without sensitive data)
            apiLogger.info(`Successful API request to ${provider}${endpoint}`, {
                responseTime,
                tokensUsed: data.usage?.total_tokens,
                requestId: headers['X-Request-ID']
            });

            return data;
        } catch (error) {
            // Retry logic for network errors or rate limiting
            if (this._shouldRetry(error.status) && currentRetry < this.retryConfig.maxRetries) {
                const nextRetry = currentRetry + 1;
                const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, currentRetry);

                apiLogger.warn(`Retrying API request (${nextRetry}/${this.retryConfig.maxRetries}) after ${delay}ms`, {
                    provider,
                    endpoint,
                    error: error.message
                });

                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.executeRequest(provider, endpoint, params, estimatedTokens, nextRetry)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                });
            }

            // Add more context to the error
            error.provider = provider;
            error.endpoint = endpoint;

            // Create safe params copy without sensitive data
            const safeParams = { ...params };
            if (safeParams.messages) {
                safeParams.messages = `[${safeParams.messages.length} messages]`;
            }
            error.params = safeParams;

            // Log error with detailed context
            apiLogger.error(`API request failed: ${error.message}`, {
                provider,
                endpoint,
                status: error.status,
                retry: currentRetry
            });

            // Handle error with the error handler
            errorHandler.handleError(error, errorHandler.categories.API, {
                provider,
                endpoint,
                currentRetry
            });

            throw error;
        }
    }

    /**
     * Check if content contains sensitive information
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Sensitivity check result
     * @private
     */
    async _checkContentSensitivity(params) {
        try {
            // Extract text content from messages
            let contentToCheck = '';

            if (params.messages && Array.isArray(params.messages)) {
                contentToCheck = params.messages
                    .filter(msg => msg.role === 'user')
                    .map(msg => msg.content)
                    .join('\n');
            } else if (params.prompt) {
                contentToCheck = params.prompt;
            }

            // If content scanner available, use it
            if (contentScanner && typeof contentScanner.scanContent === 'function') {
                return await contentScanner.scanContent(contentToCheck);
            }

            // Simple fallback checks for common patterns
            const sensitivePatterns = [
                /\b(?:\d[ -]*?){13,16}\b/,  // Credit card
                /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/,  // SSN
                /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/  // Email
            ];

            for (const pattern of sensitivePatterns) {
                if (pattern.test(contentToCheck)) {
                    return {
                        isSensitive: true,
                        reason: "Document contains potentially sensitive information",
                        detectionType: "pattern-match"
                    };
                }
            }

            // Default return if no issues found
            return { isSensitive: false };
        } catch (error) {
            apiLogger.error('Error checking content sensitivity', { error });
            // Fail open in case of error with the checker itself
            return { isSensitive: false };
        }
    }

    /**
     * Generate unique request ID
     * @returns {string} Request ID
     * @private
     */
    _generateRequestId() {
        return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if request should be retried based on error
     * @param {number} status - HTTP status code
     * @returns {boolean} Whether to retry
     * @private
     */
    _shouldRetry(status) {
        // Retry on rate limiting (429), server errors (5xx), or network issues (no status)
        return status === 429 || (status >= 500 && status < 600) || !status;
    }

    /**
     * Check rate limits before making request
     * @param {string} provider - Provider name
     * @param {number} requestedTokens - Requested token count
     * @returns {boolean} Whether request is allowed
     * @private
     */
    _checkRateLimit(provider, requestedTokens) {
        const limiter = this.rateLimiters[provider];
        if (!limiter) return true; // No rate limiter, allow

        // Refill tokens based on elapsed time
        const now = Date.now();
        const elapsedMinutes = (now - limiter.lastRefill) / (60 * 1000);
        limiter.tokens += elapsedMinutes * limiter.tokensPerMinute;
        limiter.lastRefill = now;

        // Cap at max tokens per minute
        limiter.tokens = Math.min(limiter.tokens, limiter.tokensPerMinute);

        // Check if enough tokens available
        if (limiter.tokens < requestedTokens) {
            return false;
        }

        // Consume tokens
        limiter.tokens -= requestedTokens;
        return true;
    }

    /**
     * Record API usage for rate limiting
     * @param {string} provider - Provider name
     * @param {number} tokensUsed - Tokens used
     * @private
     */
    _recordApiUsage(provider, tokensUsed) {
        // Implementation remains the same
        // ...
    }

    /**
     * Calculate actual token usage from response
     * @param {Object} response - API response
     * @param {number} estimated - Estimated token count
     * @returns {number} Actual token count
     * @private
     */
    _calculateActualTokenUsage(response, estimated) {
        return response.usage?.total_tokens || estimated;
    }

    /**
     * Validate response structure
     * @param {Object} response - API response
     * @param {string} provider - Provider name
     * @returns {boolean} Whether response is valid
     * @private
     */
    _validateResponse(response, provider) {
        // Basic validation - more complex validation would be added for production
        if (!response) return false;

        if (provider === 'openai' || provider === 'azure') {
            return response.choices && Array.isArray(response.choices);
        }

        // Default validation
        return true;
    }
}

// Create global instance
const enhancedApiClient = new EnhancedApiClient();

export default enhancedApiClient;
