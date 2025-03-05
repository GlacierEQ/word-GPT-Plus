import { ApiClient, ApiError, withRetry } from './apiClient';
import { startTiming, endTiming } from '../../utils/performance';
import { getSetting } from '../settings/settingsManager';

/**
 * OpenAI-specific error class
 */
class OpenAIError extends ApiError {
    constructor(message, statusCode, requestInfo = {}) {
        super(message, statusCode, 'OpenAI', requestInfo);
        this.name = 'OpenAIError';
    }

    getUserFriendlyMessage() {
        if (this.message.includes('insufficient_quota')) {
            return 'Your OpenAI account has insufficient credit. Please check your billing status.';
        }

        if (this.message.includes('invalid_api_key')) {
            return 'Invalid OpenAI API key. Please check your key and try again.';
        }

        if (this.message.includes('context_length_exceeded')) {
            return 'Input is too long for the OpenAI model. Please reduce the length of your text.';
        }

        if (this.message.includes('content_filter')) {
            return 'OpenAI content filter triggered. Please modify your prompt and try again.';
        }

        return super.getUserFriendlyMessage();
    }
}

/**
 * OpenAI API client implementation
 */
export class OpenAIClient extends ApiClient {
    /**
     * Create a new OpenAI client
     * @param {Object} config - Configuration
     * @param {string} config.apiKey - OpenAI API key
     * @param {string} config.baseUrl - Base URL (defaults to OpenAI's API)
     */
    constructor(config = {}) {
        const baseUrl = config.baseUrl || 'https://api.openai.com/v1';

        super({
            baseUrl,
            apiKey: config.apiKey,
            timeout: config.timeout || 60000, // 60 seconds default
            provider: 'OpenAI'
        });
    }

    /**
     * Generate text using chat completion API
     * @param {Array<Object>} messages - Chat messages
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated text
     */
    async generateChatCompletion(messages, options = {}) {
        startTiming('openai.chat');

        const data = {
            model: options.model || 'gpt-4',
            messages,
            temperature: options.temperature !== undefined ? options.temperature : 0.7,
            max_tokens: options.maxTokens || 2048,
            top_p: options.topP || 1,
            frequency_penalty: options.frequencyPenalty || 0,
            presence_penalty: options.presencePenalty || 0,
            stream: options.stream || false
        };

        try {
            const response = await this.request('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            endTiming('openai.chat', {
                model: data.model,
                messageCount: messages.length
            });

            return response;
        } catch (error) {
            endTiming('openai.chat', { error: true });
            throw error;
        }
    }

    /**
     * Generate text using completion API (legacy)
     * @param {string} prompt - Text prompt
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated text
     */
    async generateCompletion(prompt, options = {}) {
        startTiming('openai.completion');

        const data = {
            model: options.model || 'gpt-3.5-turbo-instruct',
            prompt,
            temperature: options.temperature !== undefined ? options.temperature : 0.7,
            max_tokens: options.maxTokens || 2048,
            top_p: options.topP || 1,
            frequency_penalty: options.frequencyPenalty || 0,
            presence_penalty: options.presencePenalty || 0,
            stream: options.stream || false
        };

        try {
            const response = await this.request('/completions', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            endTiming('openai.completion', {
                model: data.model,
                promptLength: prompt.length
            });

            return response;
        } catch (error) {
            endTiming('openai.completion', { error: true });
            throw error;
        }
    }

    /**
     * Analyze an image with GPT-4 Vision
     * @param {string} imageBase64 - Base64-encoded image
     * @param {string} prompt - Text prompt for image analysis
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeImage(imageBase64, prompt, options = {}) {
        startTiming('openai.vision');

        // Make sure the image is properly formatted for the API
        const imageUrl = imageBase64.startsWith('data:image')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;

        const messages = [
            {
                role: 'system',
                content: options.systemPrompt || 'You are a helpful assistant that analyzes images.'
            },
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt || 'Describe this image in detail.' },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl,
                            detail: options.highDetail ? 'high' : 'auto'
                        }
                    }
                ]
            }
        ];

        const data = {
            model: options.model || 'gpt-4-vision-preview',
            messages,
            temperature: options.temperature !== undefined ? options.temperature : 0.7,
            max_tokens: options.maxTokens || 4096
        };

        try {
            const response = await this.request('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            endTiming('openai.vision', { model: data.model });
            return response;
        } catch (error) {
            endTiming('openai.vision', { error: true });
            throw error;
        }
    }

    /**
     * Create embeddings for text
     * @param {string|Array<string>} input - Text to embed
     * @param {Object} options - Embedding options
     * @returns {Promise<Object>} Embeddings
     */
    async createEmbedding(input, options = {}) {
        startTiming('openai.embedding');

        const data = {
            model: options.model || 'text-embedding-3-small',
            input: Array.isArray(input) ? input : [input]
        };

        try {
            const response = await this.request('/embeddings', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            endTiming('openai.embedding', {
                model: data.model,
                inputCount: data.input.length
            });

            return response;
        } catch (error) {
            endTiming('openai.embedding', { error: true });
            throw error;
        }
    }

    /**
     * Get list of available models
     * @returns {Promise<Array<Object>>} Models list
     */
    async listModels() {
        try {
            const response = await this.request('/models');
            return response.data || [];
        } catch (error) {
            console.error('Error listing OpenAI models:', error);
            return [];
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
                    // Add attempt info to error for better debugging
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
                    // Don't retry auth errors or content policy violations
                    if (error.isAuthError() ||
                        error.message.includes('content_filter') ||
                        error.message.includes('content_policy_violation')) {
                        return false;
                    }
                    return error.isServerError() || error.isRateLimitError() || error.isTimeout();
                }
            }
        );
    }

    /**
     * Format error to OpenAI-specific error type
     * @param {Error} error - Original error
     * @param {Object} requestDetails - Request details
     * @returns {OpenAIError} Formatted error
     */
    formatError(error, requestDetails) {
        if (error instanceof OpenAIError) {
            return error;
        }

        if (error instanceof ApiError) {
            return new OpenAIError(
                error.message,
                error.statusCode,
                {
                    ...error.requestInfo,
                    ...requestDetails
                }
            );
        }

        return new OpenAIError(
            error.message,
            0,
            requestDetails
        );
    }
}

/**
 * Create an OpenAI client singleton
 * @returns {OpenAIClient} OpenAI client
 */
export function createOpenAIClient() {
    const apiKey = getSetting('apiKeys.openai');

    return new OpenAIClient({ apiKey });
}

// Export a singleton instance
export const openai = createOpenAIClient();
