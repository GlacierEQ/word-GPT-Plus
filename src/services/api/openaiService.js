import { ApiClient, ApiError, withRetry } from './apiClient';

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
 * OpenAI API client for text and image generation
 */
export class OpenAIClient extends ApiClient {
    constructor(config = {}) {
        super({
            baseUrl: 'https://api.openai.com/v1',
            ...config
        });
    }

    /**
     * Generate text with optional streaming
     * @param {string} prompt - Input prompt
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated text or stream
     */
    async generateText(prompt, options = {}) {
        const {
            model = 'gpt-4',
            temperature = 0.7,
            maxTokens = 1000,
            stream = false,
            systemPrompt = 'You are a helpful assistant.',
            onStreamChunk = null
        } = options;

        // Request details for error reporting
        const requestDetails = {
            endpoint: '/chat/completions',
            model,
            promptLength: prompt.length,
            temperature,
            maxTokens
        };

        try {
            // Format request
            const requestBody = {
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature,
                max_tokens: maxTokens,
                stream
            };

            // Handle streaming
            if (stream && onStreamChunk) {
                return await this.streamResponse('/chat/completions', requestBody, onStreamChunk);
            }

            // Standard request
            const response = await this.request('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return response?.choices?.[0]?.message?.content || '';
        } catch (error) {
            throw this.formatError(error, requestDetails);
        }
    }

    /**
     * Process streamed response from API
     * @param {string} endpoint - API endpoint
     * @param {Object} body - Request body
     * @param {Function} onChunk - Callback for each chunk
     * @returns {Promise<string>} Complete response text
     */
    async streamResponse(endpoint, body, onChunk) {
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new OpenAIError(
                    errorData.error?.message || `Stream request failed with status: ${response.status}`,
                    response.status,
                    { endpoint }
                );
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim() || line.trim() === 'data: [DONE]') continue;

                    try {
                        // Extract the JSON part
                        const jsonStr = line.replace(/^data: /, '').trim();
                        if (!jsonStr) continue;

                        const json = JSON.parse(jsonStr);
                        const content = json.choices?.[0]?.delta?.content || '';

                        if (content) {
                            fullText += content;
                            onChunk(content, fullText);
                        }
                    } catch (e) {
                        console.warn('Error parsing JSON from stream', e);
                    }
                }
            }

            return fullText;
        } catch (error) {
            throw this.formatError(error, { endpoint });
        }
    }

    /**
     * Analyze image using OpenAI Vision model
     * @param {string} base64Image - Base64-encoded image
     * @param {string} prompt - Prompt for image analysis
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Analysis text
     */
    async analyzeImage(base64Image, prompt, options = {}) {
        const {
            model = 'gpt-4-vision-preview',
            detail = 'auto',
            maxTokens = 1000
        } = options;

        const requestDetails = {
            endpoint: '/chat/completions',
            model,
            imageAnalysis: true
        };

        try {
            const response = await this.request('/chat/completions', {
                method: 'POST',
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt || 'Describe this image in detail.'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Image}`,
                                        detail
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: maxTokens
                })
            });

            return response?.choices?.[0]?.message?.content || '';
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
 * Create a preconfigured OpenAI client with API key
 * @param {string} apiKey - OpenAI API key
 * @returns {OpenAIClient} Configured client
 */
export const createOpenAIClient = (apiKey) => {
    return new OpenAIClient({ apiKey });
};
