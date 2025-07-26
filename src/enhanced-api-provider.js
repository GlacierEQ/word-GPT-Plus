/**
 * Enhanced API Provider for Word GPT Plus
 * Handles integration with advanced AI services and external APIs
 */

import errorHandler from './utils/error-handler';
import logger from './utils/logger';

// Create logger instance
const enhancedApiLogger = logger.createContextLogger('EnhancedAPI');

class EnhancedApiProvider {
    constructor() {
        // Initialize providers with enhanced capabilities
        this.providers = {
            groq: {
                baseUrl: 'https://api.groq.com/openai/v1',
                models: {
                    'llama2-70b-4096': { name: 'Llama 2 70B', context: 4096 },
                    'mixtral-8x7b-32768': { name: 'Mixtral 8x7B', context: 32768 },
                    'gemma-7b-it': { name: 'Gemma 7B', context: 8192 }
                },
                requiresAuth: true,
                formatRequest: this._formatGroqRequest,
                formatResponse: this._formatGroqResponse
            },
            deepseek: {
                baseUrl: 'https://api.deepseek.com/v1',
                models: {
                    'deepseek-coder-33b-instruct': { name: 'DeepSeek Coder 33B', context: 16384 },
                    'deepseek-llm-67b-chat': { name: 'DeepSeek LLM 67B', context: 32768 }
                },
                requiresAuth: true,
                formatRequest: this._formatDeepSeekRequest,
                formatResponse: this._formatDeepSeekResponse
            },
            openai: {
                baseUrl: 'https://api.openai.com/v1',
                models: {
                    'gpt-4-turbo': { name: 'GPT-4 Turbo', context: 128000 },
                    'gpt-4': { name: 'GPT-4', context: 8192 },
                    'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', context: 16385 }
                },
                requiresAuth: true,
                formatRequest: this._formatOpenAIRequest,
                formatResponse: this._formatOpenAIResponse
            }
        };
        
        // Initialize API clients
        this._initializeClients();
    }

    /**
     * Initialize API clients with environment variables
     */
    _initializeClients() {
        // Initialize API keys from environment
        this.apiKeys = {
            groq: process.env.GROQ_API_KEY,
            deepseek: process.env.DEEPSEEK_API_KEY,
            openai: process.env.OPENAI_API_KEY,
            // Add other API keys as needed
        };
    }

    /**
     * Get available models from all providers
     * @returns {Object} Available models by provider
     */
    getAvailableModels() {
        const models = {};
        for (const [providerId, provider] of Object.entries(this.providers)) {
            models[providerId] = {
                name: this._getProviderName(providerId),
                models: { ...provider.models },
                requiresAuth: provider.requiresAuth,
                isConfigured: this._isProviderConfigured(providerId)
            };
        }
        return models;
    }

    /**
     * Check if a provider is properly configured
     */
    _isProviderConfigured(providerId) {
        const provider = this.providers[providerId];
        if (!provider) return false;
        if (!provider.requiresAuth) return true;
        return !!this.apiKeys[providerId];
    }

    /**
     * Generate text using the specified provider and model
     * @param {string} provider - Provider ID
     * @param {string} model - Model ID
     * @param {string} prompt - User prompt
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation result
     */
    async generateText(providerId, model, prompt, options = {}) {
        try {
            const provider = this.providers[providerId];
            if (!provider) {
                throw new Error(`Unknown provider: ${providerId}`);
            }

            if (!this._isProviderConfigured(providerId)) {
                throw new Error(`Provider ${providerId} is not properly configured`);
            }

            enhancedApiLogger.debug(`Generating text with ${providerId}/${model}`, {
                promptLength: prompt.length,
                ...options
            });

            const endpoint = `${provider.baseUrl}/chat/completions`;
            const requestData = provider.formatRequest(prompt, { ...options, model });
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKeys[providerId]}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const result = await response.json();
            return provider.formatResponse(result);

        } catch (error) {
            enhancedApiLogger.error('Error in generateText', { error: error.message });
            throw errorHandler.handleApiError(error);
        }
    }

    // Format methods for different providers
    _formatGroqRequest(prompt, options) {
        return {
            model: options.model,
            messages: [
                { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000,
            top_p: options.topP || 1,
            frequency_penalty: options.frequencyPenalty || 0,
            presence_penalty: options.presencePenalty || 0,
            stream: options.stream || false
        };
    }

    _formatGroqResponse(response) {
        return {
            text: response.choices[0]?.message?.content || '',
            usage: response.usage,
            model: response.model,
            finishReason: response.choices[0]?.finish_reason
        };
    }

    _formatDeepSeekRequest(prompt, options) {
        return {
            model: options.model,
            messages: [
                { role: 'system', content: options.systemPrompt || 'You are a helpful AI assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000,
            top_p: options.topP || 1,
            frequency_penalty: options.frequencyPenalty || 0,
            presence_penalty: options.presencePenalty || 0,
            stream: options.stream || false
        };
    }

    _formatDeepSeekResponse(response) {
        return {
            text: response.choices[0]?.message?.content || '',
            usage: response.usage,
            model: response.model,
            finishReason: response.choices[0]?.finish_reason
        };
    }

    _formatOpenAIRequest(prompt, options) {
        return {
            model: options.model,
            messages: [
                { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000,
            top_p: options.topP || 1,
            frequency_penalty: options.frequencyPenalty || 0,
            presence_penalty: options.presencePenalty || 0,
            stream: options.stream || false
        };
    }

    _formatOpenAIResponse(response) {
        return {
            text: response.choices[0]?.message?.content || '',
            usage: response.usage,
            model: response.model,
            finishReason: response.choices[0]?.finish_reason
        };
    }

    /**
     * Get a human-readable provider name
     */
    _getProviderName(providerId) {
        const names = {
            groq: 'Groq',
            deepseek: 'DeepSeek',
            openai: 'OpenAI'
        };
        return names[providerId] || providerId;
    }
}

// Create and export singleton instance
const enhancedApiProvider = new EnhancedApiProvider();
export default enhancedApiProvider;
