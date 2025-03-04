import { ApiClient, ApiError, withRetry } from './apiClient';

/**
 * Groq-specific error class
 */
class GroqError extends ApiError {
    constructor(message, statusCode, requestInfo = {}) {
        super(message, statusCode, 'Groq', requestInfo);
        this.name = 'GroqError';
    }

    getUserFriendlyMessage() {
        if (this.message.includes('invalid_key')) {
            return 'Invalid Groq API key. Please check your key and try again.';
        }

        if (this.message.includes('model_not_found')) {
            return 'The requested model was not found. Please check model availability in your Groq account.';
        }

        return super.getUserFriendlyMessage();
    }
}

/**
 * Groq API client for high-speed inference
 */
export class GroqClient extends ApiClient {
    constructor(config = {}) {
        super({
            baseUrl: 'https://api.groq.com/openai/v1',
            ...config
        });
    }

    /**
     * Generate text using Groq's fast inference API
     * @param {string} prompt - Input prompt
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Generated text
     */
    async generateText(prompt, options = {}) {
        const {
            model = 'llama3-8b-8192',
            temperature = 0.7,
            maxTokens = 1000,
            systemPrompt = 'You are a helpful assistant.',
            stream = false,
            onStreamChunk = null
        } = options;

        // Request details for error reporting
        const requestDetails = {
            endpoint: '/chat/completions',
            model,
            promptLength: prompt.length
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
     * Process streamed response from Groq API
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
                throw new GroqError(
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
                    if (error.isAuthError()) return false;
                    return error.isServerError() || error.isRateLimitError() || error.isTimeout();
                }
            }
        );
    }

    /**
     * List available models from Groq
     * @returns {Promise<Array>} List of available models
     */
    async listModels() {
        try {
            const response = await this.request('/models', {
                method: 'GET'
            });

            return response.data || [];
        } catch (error) {
            throw this.formatError(error, { endpoint: '/models' });
        }
    }

    /**
     * Format error to Groq-specific error type
     * @param {Error} error - Original error
     * @param {Object} requestDetails - Request details
     * @returns {GroqError} Formatted error
     */
    formatError(error, requestDetails) {
        if (error instanceof GroqError) {
            return error;
        }

        if (error instanceof ApiError) {
            return new GroqError(
                error.message,
                error.statusCode,
                {
                    ...error.requestInfo,
                    ...requestDetails
                }
            );
        }

        return new GroqError(
            error.message,
            0,
            requestDetails
        );
    }
}

/**
 * Create a preconfigured Groq client
 * @param {string} apiKey - Groq API key
 * @returns {GroqClient} Configured client
 */
export const createGroqClient = (apiKey) => {
    return new GroqClient({ apiKey });
};
