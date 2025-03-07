/**
 * Word GPT Plus - Free API Provider
 * Handles integration with free AI API services
 */

import errorHandler from './utils/error-handler';
import logger from './utils/logger';

// Create logger instance
const freeApiLogger = logger.createContextLogger('FreeAPI');

class FreeApiProvider {
    constructor() {
        this.providers = {
            ollama: {
                baseUrl: 'http://localhost:11434/api',
                defaultModel: 'mistral',
                requiresAuth: false,
                formatRequest: this._formatOllamaRequest,
                formatResponse: this._formatOllamaResponse
            },
            huggingface: {
                baseUrl: 'https://api-inference.huggingface.co/models',
                defaultModel: 'mistralai/Mistral-7B-v0.1',
                requiresAuth: true,
                formatRequest: this._formatHuggingFaceRequest,
                formatResponse: this._formatHuggingFaceResponse
            },
            groq: {
                baseUrl: 'https://api.groq.com/openai/v1',
                defaultModel: 'llama2-70b-4096',
                requiresAuth: true,
                formatRequest: this._formatGroqRequest,
                formatResponse: this._formatGroqResponse
            },
            gemini: {
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                defaultModel: 'gemini-pro',
                requiresAuth: true,
                formatRequest: this._formatGeminiRequest,
                formatResponse: this._formatGeminiResponse
            }
        };
    }

    /**
     * Get available free providers
     * @returns {Object} Provider information
     */
    getAvailableProviders() {
        return Object.keys(this.providers).map(id => ({
            id,
            name: this._getProviderName(id),
            requiresAuth: this.providers[id].requiresAuth,
            defaultModel: this.providers[id].defaultModel
        }));
    }

    /**
     * Generate text using a free API provider
     * @param {string} provider - Provider ID
     * @param {string} prompt - User prompt
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Generated text
     */
    async generateText(provider, prompt, options = {}) {
        try {
            const providerConfig = this.providers[provider];
            
            if (!providerConfig) {
                throw new Error(`Unknown provider: ${provider}`);
            }

            freeApiLogger.debug(`Generating text with ${provider}`, {
                model: options.model || providerConfig.defaultModel,
                promptLength: prompt.length
            });
            
            // Format request according to provider specifications
            const endpoint = this._getEndpoint(provider, options.model || providerConfig.defaultModel);
            const requestData = providerConfig.formatRequest(prompt, options);
            
            // Prepare headers
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add authentication if needed
            if (providerConfig.requiresAuth && options.apiKey) {
                if (provider === 'huggingface') {
                    headers['Authorization'] = `Bearer ${options.apiKey}`;
                } else if (provider === 'groq') {
                    headers['Authorization'] = `Bearer ${options.apiKey}`;
                } else if (provider === 'gemini') {
                    // For Gemini, API key is added to the URL
                }
            }
            
            // Make the request
            const response = await fetch(endpoint + (provider === 'gemini' ? `?key=${options.apiKey}` : ''), {
                method: 'POST',
                headers,
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }
            
            const data = await response.json();
            return providerConfig.formatResponse(data);
        } catch (error) {
            freeApiLogger.error(`Error generating text with ${provider}`, { error });
            errorHandler.handleError(
                error, 
                errorHandler.categories.API, 
                { provider, service: 'free-api' }
            );
            throw error;
        }
    }

    /**
     * Check if a local Ollama server is available
     * @returns {Promise<boolean>} Whether Ollama is available
     */
    async checkOllamaAvailability() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                signal: AbortSignal.timeout(2000) // 2 second timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data.models) && data.models.length > 0;
            }
            return false;
        } catch (error) {
            freeApiLogger.debug('Ollama server not available', { error: error.message });
            return false;
        }
    }

    /**
     * Get available models from a local Ollama installation
     * @returns {Promise<string[]>} List of available models
     */
    async getOllamaModels() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.models?.map(model => model.name) || [];
            }
            return [];
        } catch (error) {
            freeApiLogger.error('Failed to get Ollama models', { error });
            return [];
        }
    }

    /**
     * Get formatted provider name
     * @param {string} providerId - Provider ID
     * @returns {string} Formatted name
     * @private
     */
    _getProviderName(providerId) {
        const names = {
            ollama: 'Ollama (Local Models)',
            huggingface: 'Hugging Face',
            groq: 'Groq',
            gemini: 'Google Gemini'
        };
        return names[providerId] || providerId;
    }

    /**
     * Get API endpoint for a specific provider and model
     * @param {string} provider - Provider ID
     * @param {string} model - Model name
     * @returns {string} Full API endpoint
     * @private
     */
    _getEndpoint(provider, model) {
        const config = this.providers[provider];
        
        if (provider === 'huggingface') {
            return `${config.baseUrl}/${model}`;
        } else if (provider === 'ollama') {
            return `${config.baseUrl}/generate`;
        } else if (provider === 'groq') {
            return `${config.baseUrl}/chat/completions`;
        } else if (provider === 'gemini') {
            return `${config.baseUrl}/models/${model || 'gemini-pro'}:generateContent`;
        }
        
        return config.baseUrl;
    }

    // Provider-specific request formatters
    
    _formatOllamaRequest(prompt, options) {
        return {
            model: options.model || 'mistral',
            prompt: prompt,
            stream: false,
            options: {
                temperature: options.temperature || 0.7,
                top_p: options.topP || 0.9
            }
        };
    }
    
    _formatHuggingFaceRequest(prompt, options) {
        return {
            inputs: prompt,
            parameters: {
                temperature: options.temperature || 0.7,
                top_p: options.topP || 0.9,
                max_new_tokens: options.maxTokens || 500,
                return_full_text: false
            }
        };
    }
    
    _formatGroqRequest(prompt, options) {
        return {
            model: options.model || 'llama2-70b-4096',
            messages: [
                {
                    role: 'system',
                    content: options.systemMessage || 'You are a helpful writing assistant.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 500
        };
    }
    
    _formatGeminiRequest(prompt, options) {
        return {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: options.temperature || 0.7,
                topP: options.topP || 0.9,
                maxOutputTokens: options.maxTokens || 500
            }
        };
    }

    // Provider-specific response formatters
    
    _formatOllamaResponse(data) {
        return data.response || '';
    }
    
    _formatHuggingFaceResponse(data) {
        if (Array.isArray(data) && data.length > 0) {
            return data[0]?.generated_text || '';
        }
        return data.generated_text || '';
    }
    
    _formatGroqResponse(data) {
        return data.choices?.[0]?.message?.content || '';
    }
    
    _formatGeminiResponse(data) {
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
}

// Create global instance
const freeApiProvider = new FreeApiProvider();
export default freeApiProvider;
