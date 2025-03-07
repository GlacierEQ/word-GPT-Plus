/**
 * Update the API client to use the improved error handling and logging
 */

// Import error handler and logger
import errorHandler from '../utils/error-handler';
import logger from '../utils/logger';

// Create a logger specific to the API module
const apiLogger = logger.createContextLogger('API');

// Update the makeApiRequest method in the ApiClient class
async executeRequest(provider, endpoint, params, estimatedTokens) {
    try {
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

        // Get API key
        const apiKey = this.apiConfig.keys[provider];

        if (!apiKey && provider !== 'localServer') {
            throw new Error(`API key not found for provider: ${provider}`);
        }

        // Prepare headers
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add authorization header based on provider
        if (provider === 'openai') {
            headers['Authorization'] = `Bearer ${apiKey}`;
        } else if (provider === 'azure') {
            headers['api-key'] = apiKey;
        }

        // Make the request
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
            signal: AbortSignal.timeout(this.apiConfig.timeout || 60000)
        });

        // Calculate response time
        const responseTime = performance.now() - startTime;

        // Log performance data
        apiLogger.debug(`Received response in ${responseTime.toFixed(2)}ms`, {
            status: response.status,
            responseTime,
            provider
        });

        // Check for HTTP errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Invalid JSON response' }));

            // Create a structured error object
            const error = new Error(errorData.error?.message || 'API request failed');
            error.status = response.status;
            error.statusText = response.statusText;
            error.data = errorData;
            error.provider = provider;
            error.endpoint = endpoint;

            // Handle error with the error handler
            errorHandler.handleError(error, errorHandler.categories.API, {
                provider,
                endpoint,
                status: response.status,
                statusText: response.statusText
            });

            throw error;
        }

        // Parse response
        const data = await response.json();

        // Record API usage for rate limiting
        this.recordApiUsage(provider, estimatedTokens);

        // Log success
        apiLogger.info(`Successful API request to ${provider}${endpoint}`, {
            responseTime,
            tokensUsed: data.usage?.total_tokens
        });

        return data;
    } catch (error) {
        // Retry logic for network errors or rate limiting
        if (this.shouldRetry(error.status) && currentRetry < this.retryConfig.maxRetries) {
            const nextRetry = currentRetry + 1;
            const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, currentRetry);

            apiLogger.warn(`Retrying API request (${nextRetry}/${this.retryConfig.maxRetries}) after ${delay}ms`, {
                provider,
                endpoint,
                error: error.message
            });

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.retryRequest(provider, endpoint, params, estimatedTokens, nextRetry)
                        .then(resolve)
                        .catch(reject);
                }, delay);
            });
        }

        // Add more context to the error
        error.provider = provider;
        error.endpoint = endpoint;
        error.params = { ...params };

        // Remove sensitive data from error
        if (error.params.messages) {
            error.params.messages = `[${error.params.messages.length} messages]`;
        }

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
