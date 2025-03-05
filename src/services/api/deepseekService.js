import { ApiClient } from './apiClient';
import { startTiming, endTiming } from '../../utils/performance';
import { getSetting } from '../settings/settingsManager';

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
 * DeepSeek API client implementation
 */
export class DeepSeekClient extends ApiClient {
    /**
     * Create a new DeepSeek client
     * @param {Object} config - Configuration
     * @param {string} config.apiKey - DeepSeek API key
     * @param {string} config.baseUrl - Base URL (defaults to DeepSeek's API)
     * @param {boolean} config.nonCommercial - Whether to use non-commercial mode
     */
    constructor(config = {}) {
        // Get the custom endpoint or use the default
        const baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';

        super({
            baseUrl,
            apiKey: config.apiKey,
            timeout: config.timeout || 60000, // 60 seconds default
            provider: 'DeepSeek'
        });

        this.nonCommercial = config.nonCommercial === true;
        this.useOpenAIKey = config.useOpenAIKey === true;
    }

    /**
     * Generate text with DeepSeek models
     * @param {Array<Object>} messages - Chat messages
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated text
     */
    async generateText(messages, options = {}) {
        startTiming('deepseek.chat');

        const data = {
            model: options.model || 'deepseek-chat',
            messages,
            temperature: options.temperature !== undefined ? options.temperature : 0.7,
            max_tokens: options.maxTokens || 2048,
            top_p: options.topP || 1,
            stream: options.stream || false
        };

        try {
            // Add non-commercial header if required
            const headers = this.nonCommercial ?
                { 'X-DeepSeek-Usage': 'non-commercial' } : {};

            const response = await this.request('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(data),
                headers
            });

            endTiming('deepseek.chat', {
                model: data.model,
                messageCount: messages.length
            });

            return response;
        } catch (error) {
            endTiming('deepseek.chat', { error: true });
            throw error;
        }
    }

    /**
     * Analyze an image with DeepSeek Vision Language models
     * @param {string} imageBase64 - Base64-encoded image
     * @param {string} prompt - Text prompt for image analysis
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeImage(imageBase64, prompt, options = {}) {
        startTiming('deepseek.vision');

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
                            url: imageUrl
                        }
                    }
                ]
            }
        ];

        const data = {
            model: options.model || 'deepseek-vl-2.0-base',
            messages,
            temperature: options.temperature !== undefined ? options.temperature : 0.7,
            max_tokens: options.maxTokens || 4096
        };

        try {
            // Add non-commercial header if required
            const headers = this.nonCommercial ?
                { 'X-DeepSeek-Usage': 'non-commercial' } : {};

            const response = await this.request('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(data),
                headers
            });

            endTiming('deepseek.vision', { model: data.model });
            return response;
        } catch (error) {
            endTiming('deepseek.vision', { error: true });
            throw error;
        }
    }

    /**
     * Check if API key is valid and has commercial access
     * @returns {Promise<Object>} Status info
     */
    async checkApiAccess() {
        try {
            // Make a minimal request to check authentication
            const messages = [
                { role: 'user', content: 'Hello' }
            ];

            const data = {
                model: 'deepseek-chat',
                messages,
                max_tokens: 5
            };

            await this.request('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            return {
                valid: true,
                commercial: true,
                message: 'API key is valid and has commercial access.'
            };
        } catch (error) {
            if (error.statusCode === 401) {
                return {
                    valid: false,
                    commercial: false,
                    message: 'Invalid API key.'
                };
            }

            if (error.statusCode === 403) {
                // Try with non-commercial header
                try {
                    const messages = [
                        { role: 'user', content: 'Hello' }
                    ];

                    const data = {
                        model: 'deepseek-chat',
                        messages,
                        max_tokens: 5
                    };

                    await this.request('/chat/completions', {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: {
                            'X-DeepSeek-Usage': 'non-commercial'
                        }
                    });

                    return {
                        valid: true,
                        commercial: false,
                        message: 'API key is valid but only has non-commercial access.'
                    };
                } catch (innerError) {
                    return {
                        valid: false,
                        commercial: false,
                        message: 'API key does not have access to DeepSeek services.'
                    };
                }
            }

            return {
                valid: false,
                commercial: false,
                message: `Error checking API key: ${error.message}`
            };
        }
    }
}

/**
 * Create a DeepSeek client based on current settings
 * @returns {DeepSeekClient} DeepSeek client
 */
export function createDeepSeekClient() {
    const useNonCommercial = getSetting('usage.deepseekNonCommercial', true);
    const useSeperateKey = getSetting('usage.useSeperateDeepseekKey', false);
    const deepseekEndpoint = getSetting('usage.deepseekEndpoint', 'https://api.deepseek.com/v1');

    // Determine which API key to use
    let apiKey;
    if (useNonCommercial) {
        apiKey = null; // No API key needed for non-commercial
    } else if (useSeperateKey) {
        apiKey = getSetting('apiKeys.deepseek');
    } else {
        apiKey = getSetting('apiKeys.openai'); // Fall back to OpenAI key
    }

    return new DeepSeekClient({
        apiKey,
        baseUrl: deepseekEndpoint,
        nonCommercial: useNonCommercial,
        useOpenAIKey: !useSeperateKey && !useNonCommercial
    });
}

// Export a singleton instance
export const deepseek = createDeepSeekClient();
