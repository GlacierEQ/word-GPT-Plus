/**
 * Word GPT Plus - API Client
 * Manages API communications with various AI providers
 */

class ApiClient {
    constructor() {
        // Configuration for various API providers
        this.apiProviders = {
            openai: {
                name: 'OpenAI',
                baseUrl: 'https://api.openai.com/v1',
                endpoints: {
                    completions: '/completions',
                    chatCompletions: '/chat/completions',
                    embeddings: '/embeddings',
                    models: '/models'
                },
                defaultModel: 'gpt-3.5-turbo',
                rateLimits: {
                    requestsPerMinute: 60,
                    tokensPerMinute: 90000
                }
            },
            azure: {
                name: 'Azure OpenAI',
                baseUrl: null, // Must be configured by user
                endpoints: {
                    completions: '/completions',
                    chatCompletions: '/chat/completions',
                    embeddings: '/embeddings'
                },
                deploymentRequired: true,
                defaultModel: null, // Must be configured by user
                rateLimits: {
                    requestsPerMinute: 240,
                    tokensPerMinute: 240000
                }
            },
            localServer: {
                name: 'Local Inference Server',
                baseUrl: 'http://localhost:8080',
                endpoints: {
                    completions: '/v1/completions',
                    chatCompletions: '/v1/chat/completions',
                    embeddings: '/v1/embeddings'
                },
                defaultModel: 'local-model',
                rateLimits: null // Determined by local hardware
            }
        };

        // API keys and configuration
        this.apiConfig = {
            activeProvider: 'openai',
            keys: {},
            customEndpoints: {}
        };

        // Rate limiting trackers
        this.rateLimitTracking = {};

        // Retry configuration
        this.retryConfig = {
            maxRetries: 3,
            initialDelay: 1000, // ms
            backoffFactor: 2
        };

        // Queue for API requests
        this.requestQueue = [];
        this.isProcessingQueue = false;

        // Load API configuration
        this.loadApiConfig();

        // Initialize rate limit tracking
        this.initializeRateLimitTracking();
    }

    /**
     * Load API configuration from storage
     */
    loadApiConfig() {
        try {
            const savedConfig = localStorage.getItem('wordGptPlusApiConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);

                // Use security module if available for decryption
                if (window.securityProtocol && window.securityProtocol.decrypt) {
                    try {
                        const decryptedKeys = {};
                        Object.entries(parsedConfig.keys || {}).forEach(([provider, encryptedKey]) => {
                            decryptedKeys[provider] = window.securityProtocol.decrypt(encryptedKey, 'local');
                        });
                        parsedConfig.keys = decryptedKeys;
                    } catch (decryptError) {
                        console.error('Error decrypting API keys:', decryptError);
                        // Continue with encrypted keys as fallback
                    }
                }

                // Merge with existing config
                this.apiConfig = {
                    ...this.apiConfig,
                    ...parsedConfig
                };

                console.log('API configuration loaded successfully');
            }
        } catch (error) {
            console.error('Error loading API configuration:', error);
        }
    }

    /**
     * Save API configuration to storage
     */
    saveApiConfig() {
        try {
            // Create a copy of the configuration
            const configToSave = {
                activeProvider: this.apiConfig.activeProvider,
                keys: { ...this.apiConfig.keys },
                customEndpoints: { ...this.apiConfig.customEndpoints }
            };

            // Use security module if available for encryption
            if (window.securityProtocol && window.securityProtocol.encrypt) {
                try {
                    const encryptedKeys = {};
                    Object.entries(configToSave.keys).forEach(([provider, key]) => {
                        encryptedKeys[provider] = window.securityProtocol.encrypt(key, 'local');
                    });
                    configToSave.keys = encryptedKeys;
                } catch (encryptError) {
                    console.error('Error encrypting API keys:', encryptError);
                    // Continue with unencrypted keys as fallback
                }
            }

            localStorage.setItem('wordGptPlusApiConfig', JSON.stringify(configToSave));
        } catch (error) {
            console.error('Error saving API configuration:', error);
        }
    }

    /**
     * Initialize rate limit tracking
     */
    initializeRateLimitTracking() {
        Object.keys(this.apiProviders).forEach(provider => {
            if (this.apiProviders[provider].rateLimits) {
                this.rateLimitTracking[provider] = {
                    requestTimestamps: [],
                    tokenCounts: []
                };
            }
        });
    }

    /**
     * Set API key for a provider
     * @param {string} provider - Provider name
     * @param {string} key - API key
     */
    setApiKey(provider, key) {
        if (!this.apiProviders[provider]) {
            throw new Error(`Unknown API provider: ${provider}`);
        }

        this.apiConfig.keys[provider] = key;
        this.saveApiConfig();
    }

    /**
     * Set active API provider
     * @param {string} provider - Provider name
     * @returns {boolean} Success status
     */
    setActiveProvider(provider) {
        if (!this.apiProviders[provider]) {
            throw new Error(`Unknown API provider: ${provider}`);
        }

        // Check if provider has required configuration
        if (provider === 'azure') {
            if (!this.apiConfig.customEndpoints.azure) {
                throw new Error('Azure OpenAI requires endpoint configuration');
            }
        }

        this.apiConfig.activeProvider = provider;
        this.saveApiConfig();
        return true;
    }

    /**
     * Set custom endpoint for a provider
     * @param {string} provider - Provider name
     * @param {string} endpoint - Custom endpoint URL
     */
    setCustomEndpoint(provider, endpoint) {
        if (!this.apiProviders[provider]) {
            throw new Error(`Unknown API provider: ${provider}`);
        }

        this.apiConfig.customEndpoints[provider] = endpoint;
        this.saveApiConfig();
    }

    /**
     * Check if provider is configured
     * @param {string} provider - Provider name
     * @returns {boolean} Is configured
     */
    isProviderConfigured(provider) {
        // Check if provider exists
        if (!this.apiProviders[provider]) {
            return false;
        }

        // Check if API key exists if required
        if (provider !== 'localServer' && !this.apiConfig.keys[provider]) {
            return false;
        }

        // Check for Azure-specific requirements
        if (provider === 'azure' && !this.apiConfig.customEndpoints.azure) {
            return false;
        }

        return true;
    }

    /**
     * Get the base URL for the current provider
     * @param {string} [provider] - Provider name (optional, uses active provider if not specified)
     * @returns {string} Base URL
     */
    getBaseUrl(provider = null) {
        const providerName = provider || this.apiConfig.activeProvider;

        // Check if provider has a custom endpoint
        if (this.apiConfig.customEndpoints[providerName]) {
            return this.apiConfig.customEndpoints[providerName];
        }

        return this.apiProviders[providerName].baseUrl;
    }

    /**
     * Check if a request would exceed rate limits
     * @param {string} provider - Provider name
     * @param {number} tokenCount - Expected token count
     * @returns {boolean} True if rate limited
     */
    checkRateLimit(provider, tokenCount = 0) {
        const tracking = this.rateLimitTracking[provider];
        if (!tracking) return false;

        const limits = this.apiProviders[provider].rateLimits;
        if (!limits) return false;

        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Clean up old entries
        tracking.requestTimestamps = tracking.requestTimestamps.filter(time => time > oneMinuteAgo);
        tracking.tokenCounts = tracking.tokenCounts.filter(entry => entry.time > oneMinuteAgo);

        // Check request count limit
        if (tracking.requestTimestamps.length >= limits.requestsPerMinute) {
            console.warn(`Rate limit reached for ${provider}: too many requests`);
            return true;
        }

        // Check token count limit
        const recentTokens = tracking.tokenCounts.reduce((sum, entry) => sum + entry.count, 0);
        if (recentTokens + tokenCount >= limits.tokensPerMinute) {
            console.warn(`Rate limit reached for ${provider}: token limit exceeded`);
            return true;
        }

        return false;
    }

    /**
     * Record API usage for rate limiting
     * @param {string} provider - Provider name
     * @param {number} tokenCount - Token count used
     */
    recordApiUsage(provider, tokenCount = 0) {
        const tracking = this.rateLimitTracking[provider];
        if (!tracking) return;

        const now = Date.now();

        tracking.requestTimestamps.push(now);

        if (tokenCount > 0) {
            tracking.tokenCounts.push({
                time: now,
                count: tokenCount
            });
        }
    }

    /**
     * Estimate token count for a request
     * @param {Object} request - Request parameters
     * @returns {number} Estimated token count
     */
    estimateTokenCount(request) {
        // This is a simplified estimation
        // In a real implementation, this would use a more accurate algorithm

        // Base counts for different request types
        if (request.messages) {
            // Chat completion
            return request.messages.reduce((total, message) => {
                // Roughly 4 characters per token for English text
                return total + Math.ceil((message.content?.length || 0) / 4);
            }, 0);
        } else if (request.prompt) {
            // Text completion
            return Math.ceil(request.prompt.length / 4);
        } else if (request.input) {
            // Embeddings
            return Math.ceil(request.input.length / 4);
        }

        return 0;
    }

    /**
     * Make an API request to the chat completions endpoint
     * @param {Array} messages - Array of message objects
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async createChatCompletion(messages, options = {}) {
        const provider = options.provider || this.apiConfig.activeProvider;

        if (!this.isProviderConfigured(provider)) {
            throw new Error(`Provider ${provider} is not properly configured`);
        }

        const providerConfig = this.apiProviders[provider];
        const model = options.model || providerConfig.defaultModel;

        // Build request parameters
        const requestParams = {
            model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || 1000,
            top_p: options.topP ?? 1,
            frequency_penalty: options.frequencyPenalty ?? 0,
            presence_penalty: options.presencePenalty ?? 0,
        };

        // Add Azure deployment name if needed
        if (provider === 'azure' && providerConfig.deploymentRequired) {
            requestParams.deployment_id = options.deployment || model;
        }

        // Estimate token count for rate limiting
        const estimatedTokens = this.estimateTokenCount({ messages }) + requestParams.max_tokens;

        // Get appropriate endpoint
        const endpoint = providerConfig.endpoints.chatCompletions;

        return this.makeApiRequest(provider, endpoint, requestParams, estimatedTokens);
    }

    /**
     * Make an API request to the completions endpoint
     * @param {string} prompt - Text prompt
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async createCompletion(prompt, options = {}) {
        const provider = options.provider || this.apiConfig.activeProvider;

        if (!this.isProviderConfigured(provider)) {
            throw new Error(`Provider ${provider} is not properly configured`);
        }

        const providerConfig = this.apiProviders[provider];
        const model = options.model || providerConfig.defaultModel;

        // Build request parameters
        const requestParams = {
            model,
            prompt,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || 1000,
            top_p: options.topP ?? 1,
            frequency_penalty: options.frequencyPenalty ?? 0,
            presence_penalty: options.presencePenalty ?? 0,
        };

        // Add Azure deployment name if needed
        if (provider === 'azure' && providerConfig.deploymentRequired) {
            requestParams.deployment_id = options.deployment || model;
        }

        // Estimate token count for rate limiting
        const estimatedTokens = this.estimateTokenCount({ prompt }) + requestParams.max_tokens;

        // Get appropriate endpoint
        const endpoint = providerConfig.endpoints.completions;

        return this.makeApiRequest(provider, endpoint, requestParams, estimatedTokens);
    }

    /**
     * Make an API request to the embeddings endpoint
     * @param {string} input - Input text
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async createEmbedding(input, options = {}) {
        const provider = options.provider || this.apiConfig.activeProvider;

        if (!this.isProviderConfigured(provider)) {
            throw new Error(`Provider ${provider} is not properly configured`);
        }

        const providerConfig = this.apiProviders[provider];
        const model = options.model || 'text-embedding-ada-002'; // Default embedding model

        // Build request parameters
        const requestParams = {
            model,
            input
        };

        // Add Azure deployment name if needed
        if (provider === 'azure' && providerConfig.deploymentRequired) {
            requestParams.deployment_id = options.deployment || model;
        }

        // Estimate token count for rate limiting
        const estimatedTokens = this.estimateTokenCount({ input });

        // Get appropriate endpoint
        const endpoint = providerConfig.endpoints.embeddings;

        return this.makeApiRequest(provider, endpoint, requestParams, estimatedTokens);
    }

    /**
     * Make an API request
     * @param {string} provider - Provider name
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @param {number} estimatedTokens - Estimated token usage
     * @returns {Promise<Object>} API response
     */
    async makeApiRequest(provider, endpoint, params, estimatedTokens = 0) {
        // Check rate limits
        if (this.checkRateLimit(provider, estimatedTokens)) {
            // Add to queue and process when available
            return new Promise((resolve, reject) => {
                this.requestQueue.push({
                    provider,
                    endpoint,
                    params,
                    estimatedTokens,
                    resolve,
                    reject,
                    retries: 0
                });

                this.processRequestQueue();
            });
        }

        // Make the request
        return this.executeRequest(provider, endpoint, params, estimatedTokens);
    }

    /**
     * Execute an API request
     * @param {string} provider - Provider name
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @param {number} estimatedTokens - Estimated token usage
     * @returns {Promise<Object>} API response
     */
    async executeRequest(provider, endpoint, params, estimatedTokens) {
        try {
            const baseUrl = this.getBaseUrl(provider);
            const url = `${baseUrl}${endpoint}`;

            // Get API key
            const apiKey = this.apiConfig.keys[provider];

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

            // Make request
            console.log(`Making API request to ${provider}:${endpoint}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(params)
            });

            // Record API usage
            this.recordApiUsage(provider, estimatedTokens);

            // Check if response is OK
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                const error = new Error(`API error (${response.status}): ${errorData.error}`);
                error.status = response.status;
                error.provider = provider;
                error.endpoint = endpoint;

                // Check if we should retry based on status code
                if (this.shouldRetry(response.status)) {
                    throw error; // Will be caught and retried
                }

                // Otherwise, propagate error
                throw error;
            }

            // Parse response
            const data = await response.json();

            // Calculate actual token usage if available
            if (data.usage && data.usage.total_tokens) {
                // If actual token usage is available, update our tracking
                const actualTokens = data.usage.total_tokens;

                // Update the last token count entry
                const tracking = this.rateLimitTracking[provider];
                if (tracking && tracking.tokenCounts.length > 0) {
                    const lastEntry = tracking.tokenCounts[tracking.tokenCounts.length - 1];
                    lastEntry.count = actualTokens;
                }
            }

            return data;
        } catch (error) {
            // Handle retryable errors
            if (this.shouldRetry(error.status)) {
                return this.retryRequest(provider, endpoint, params, estimatedTokens);
            }

            throw error;
        }
    }

    /**
     * Process queued requests
     */
    async processRequestQueue() {
        // If already processing or queue is empty, do nothing
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        try {
            // Process queue until empty
            while (this.requestQueue.length > 0) {
                const request = this.requestQueue[0];

                // Check if we can send the request now
                if (this.checkRateLimit(request.provider, request.estimatedTokens)) {
                    // Still rate limited, wait and try again
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                // Remove request from queue
                this.requestQueue.shift();

                try {
                    // Execute request
                    const result = await this.executeRequest(
                        request.provider,
                        request.endpoint,
                        request.params,
                        request.estimatedTokens
                    );

                    request.resolve(result);
                } catch (error) {
                    request.reject(error);
                }
            }
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Retry a failed request with exponential backoff
     * @private
     */
    async retryRequest(provider, endpoint, params, estimatedTokens, currentRetry = 0) {
        const maxRetries = this.retryConfig.maxRetries;

        if (currentRetry >= maxRetries) {
            throw new Error(`Maximum retries (${maxRetries}) exceeded for ${provider}:${endpoint}`);
        }

        // Calculate backoff delay
        const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, currentRetry);

        console.log(`Retrying API request to ${provider}:${endpoint} (attempt ${currentRetry + 1}/${maxRetries}) after ${delay}ms`);

        // Wait for backoff delay
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            return await this.executeRequest(provider, endpoint, params, estimatedTokens);
        } catch (error) {
            if (this.shouldRetry(error.status)) {
                return this.retryRequest(provider, endpoint, params, estimatedTokens, currentRetry + 1);
            }
            throw error;
        }
    }

    /**
     * Check if an error should trigger a retry
     * @private
     */
    shouldRetry(statusCode) {
        // Retry on rate limiting and server errors
        return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
    }

    /**
     * Get available models from the provider
     * @param {string} [provider] - Provider name (optional, uses active provider if not specified)
     * @returns {Promise<Array>} List of available models
     */
    async getAvailableModels(provider = null) {
        const providerName = provider || this.apiConfig.activeProvider;

        if (!this.isProviderConfigured(providerName)) {
            throw new Error(`Provider ${providerName} is not properly configured`);
        }

        try {
            const baseUrl = this.getBaseUrl(providerName);
            const endpoint = this.apiProviders[providerName].endpoints.models;

            const url = `${baseUrl}${endpoint}`;

            // Get API key
            const apiKey = this.apiConfig.keys[providerName];

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add authorization header based on provider
            if (providerName === 'openai') {
                headers['Authorization'] = `Bearer ${apiKey}`;
            } else if (providerName === 'azure') {
                headers['api-key'] = apiKey;
            }

            // Make request
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(`Failed to get models: ${errorData.error}`);
            }

            const data = await response.json();
            return data.data || data;
        } catch (error) {
            console.error(`Error fetching available models from ${providerName}:`, error);
            throw error;
        }
    }

    /**
     * Generate text based on a prompt
     * @param {string} prompt - Text prompt
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Generated text
     */
    async generateText(prompt, options = {}) {
        try {
            // Use chat completions by default for newer models
            if (options.useChatModel !== false) {
                const messages = [{
                    role: 'user',
                    content: prompt
                }];

                const response = await this.createChatCompletion(messages, options);

                if (response.choices && response.choices[0] && response.choices[0].message) {
                    return response.choices[0].message.content;
                } else {
                    throw new Error('Invalid response format from chat completion');
                }
            } else {
                // Use traditional completions for older models
                const response = await this.createCompletion(prompt, options);

                if (response.choices && response.choices[0] && response.choices[0].text) {
                    return response.choices[0].text;
                } else {
                    throw new Error('Invalid response format from completion');
                }
            }
        } catch (error) {
            console.error('Error generating text:', error);
            throw error;
        }
    }
}

// Create global instance
const apiClient = new ApiClient();