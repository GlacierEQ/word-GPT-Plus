import { ApiClient, ApiError, withRetry } from './apiClient';

/**
 * DeepSeek-specific error class
 */
class DeepSeekError extends ApiError {
    constructor(message, statusCode, requestInfo = {}) {
        super(message, statusCode, 'DeepSeek', requestInfo);
        this.name = 'DeepSeekError';
    }

    getUserFriendlyMessage() {
        if (this.statusCode === 403 && this.message.includes('commercial_use_required')) {
            return 'This operation requires commercial use. Please enable commercial usage in settings and provide an API key.';
        }

        // Handle DeepSeek-specific error messages
        if (this.message.includes('token_limit_exceeded')) {
            return 'Input is too long for the DeepSeek model. Please reduce the length of your text.';
        }

        return super.getUserFriendlyMessage();
    }
}

/**
 * DeepSeek API client for vision and language models
 */
export class DeepSeekClient extends ApiClient {
    constructor(config = {}) {
        super({
            baseUrl: config.endpoint || 'https://api.deepseek.com/v1',
            ...config
        });

        this.isCommercialUse = config.isCommercialUse !== false;
        this.allowNonCommercialKeyless = config.allowNonCommercialKeyless === true;
    }

    /**
     * Get appropriate API endpoint based on usage type
     * @returns {string} API endpoint URL
     * @private
     */
    getEndpoint() {
        // Non-commercial usage without API key goes to the free tier endpoint
        if (!this.isCommercialUse && !this.apiKey && this.allowNonCommercialKeyless) {
            return 'https://api-free.deepseek.com/v1';
        }

        return this.baseUrl;
    }

    /**
     * Generate text with DeepSeek language model
     * @param {string} prompt - Input prompt
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Generated text
     */
    async generateText(prompt, options = {}) {
        const {
            model = 'deepseek-chat',
            temperature = 0.7,
            maxTokens = 1000,
            systemPrompt = 'You are a helpful assistant.'
        } = options;

        const requestDetails = {
            endpoint: '/chat/completions',
            model,
            promptLength: prompt.length
        };

        try {
            // Check if we're allowed to make this request
            if (this.isCommercialUse && !this.apiKey) {
                throw new DeepSeekError(
                    'API key required for commercial usage',
                    403,
                    requestDetails
                );
            }

            // Prepare request body
            const requestBody = {
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature,
                max_tokens: maxTokens
            };

            // Add non-commercial flag if applicable
            if (!this.isCommercialUse && this.allowNonCommercialKeyless) {
                requestBody.usage_type = 'non-commercial';
            }

            // Make the API request with custom headers based on usage type
            const headers = {};

            // For non-commercial keyless use, add appropriate headers
            if (!this.apiKey && !this.isCommercialUse && this.allowNonCommercialKeyless) {
                headers['X-DeepSeek-Usage'] = 'non-commercial';
                headers['X-DeepSeek-Client'] = 'word-gpt-plus';
            }

            const response = await this.request('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers,
                baseUrl: this.getEndpoint()
            });

            return response?.choices?.[0]?.message?.content || '';
        } catch (error) {
            throw this.formatError(error, requestDetails);
        }
    }

    /**
     * Analyze image using DeepSeek VL model
     * @param {string} base64Image - Base64-encoded image
     * @param {string} prompt - Prompt for analysis
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeImage(base64Image, prompt, options = {}) {
        const {
            model = 'deepseek-vl-2.0-base',
            temperature = 0.2,
            maxTokens = 2000,
            analysisType = 'general'
        } = options;

        // Select appropriate system prompt based on analysis type
        let systemPrompt = "You are a professional image analyst with expertise in visual detail extraction.";

        if (analysisType === 'home_inspection') {
            systemPrompt = "You are a certified home inspector with 20+ years of experience analyzing property conditions. Focus on identifying potential issues, code violations, safety concerns, and maintenance needs.";
        } else if (analysisType === 'legal_evidence') {
            systemPrompt = "You are a forensic image analyst with legal expertise. Provide objective, factual descriptions without speculation or opinion. Focus on elements that could be legally relevant.";
        } else if (analysisType === 'property_damage') {
            systemPrompt = "You are an insurance claim adjuster specializing in property damage assessment. Provide detailed analysis of visible damage, affected materials, and estimated severity.";
        }

        const requestDetails = {
            endpoint: '/chat/completions',
            model,
            imageAnalysis: true,
            analysisType
        };

        try {
            // Check commercial use requirements
            if (this.isCommercialUse && !this.apiKey) {
                throw new DeepSeekError(
                    'API key required for commercial usage',
                    403,
                    requestDetails
                );
            }

            // Prepare request body
            const requestBody = {
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt || 'Please analyze this image thoroughly and provide detailed observations.'
                            },
                            {
                                type: 'image_url',
                                image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                            }
                        ]
                    }
                ],
                temperature,
                max_tokens: maxTokens
            };

            // Add non-commercial usage flag if applicable
            if (!this.isCommercialUse && this.allowNonCommercialKeyless) {
                requestBody.usage_type = 'non-commercial';
            }

            // Custom headers for non-commercial usage
            const headers = {};
            if (!this.apiKey && !this.isCommercialUse && this.allowNonCommercialKeyless) {
                headers['X-DeepSeek-Usage'] = 'non-commercial';
                headers['X-DeepSeek-Client'] = 'word-gpt-plus';
            }

            const response = await this.request('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers,
                baseUrl: this.getEndpoint()
            });

            return {
                analysis: response?.choices?.[0]?.message?.content || '',
                model,
                usage: response.usage,
                keyless: !this.apiKey && !this.isCommercialUse
            };
        } catch (error) {
            throw this.formatError(error, requestDetails);
        }
    }

    /**
     * Generate text with retry mechanism
     * @param {string} prompt - Text prompt
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Generated text
     */
    async generateTextWithRetry(prompt, options = {}) {
        return withRetry(
            async (attempt) => {
                try {
                    return await this.generateText(prompt, options);
                } catch (error) {
                    error.requestInfo = {
                        ...error.requestInfo,
                        attempt
                    };
                    throw error;
                }
            },
            {
                maxRetries: options.maxRetries || 3,
                shouldRetry: (error) => {
                    // Don't retry auth errors or commercial use violations
                    if (error.isAuthError() || error.message.includes('commercial_use_required')) {
                        return false;
                    }
                    return error.isServerError() || error.isRateLimitError() || error.isTimeout();
                }
            }
        );
    }

    /**
     * Format error to DeepSeek-specific error type
     * @param {Error} error - Original error
     * @param {Object} requestDetails - Request details
     * @returns {DeepSeekError} Formatted error
     */
    formatError(error, requestDetails) {
        if (error instanceof DeepSeekError) {
            return error;
        }

        if (error instanceof ApiError) {
            return new DeepSeekError(
                error.message,
                error.statusCode,
                {
                    ...error.requestInfo,
                    ...requestDetails
                }
            );
        }

        return new DeepSeekError(
            error.message,
            0,
            requestDetails
        );
    }
}

/**
 * Create a preconfigured DeepSeek client
 * @param {Object} config - Configuration options
 * @returns {DeepSeekClient} Configured client
 */
export const createDeepSeekClient = (config = {}) => {
    return new DeepSeekClient(config);
};
