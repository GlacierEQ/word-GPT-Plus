/**
 * Model manager for selecting between API and embedded models
 */

import { generateText as generateWithEmbedded, getModelMemoryRequirements } from './embeddedModels';
import { generateWithLocalModel, isOllamaAvailable } from './localModels';

/**
 * Available model types
 */
export const MODEL_TYPES = {
    API_OPENAI: 'api_openai',
    API_AZURE: 'api_azure',
    API_GEMINI: 'api_gemini',
    API_GROQ: 'api_groq',
    LOCAL_OLLAMA: 'local_ollama',
    EMBEDDED: 'embedded',
};

/**
 * Get available models based on configuration
 * @returns {Promise<Array>} Available model options
 */
export async function getAvailableModels() {
    const models = [];

    // Always add embedded models (they work everywhere)
    models.push({
        type: MODEL_TYPES.EMBEDDED,
        name: 'TinyLlama-1.1B (Embedded)',
        description: 'Free quantized model, runs directly in Word',
        requiresKey: false,
    });

    models.push({
        type: MODEL_TYPES.EMBEDDED,
        name: 'Flan-T5-Small (Embedded)',
        description: 'Lightweight model for simple tasks',
        requiresKey: false,
    });

    // Check if Ollama is available
    try {
        const ollamaAvailable = await isOllamaAvailable();

        if (ollamaAvailable) {
            models.push({
                type: MODEL_TYPES.LOCAL_OLLAMA,
                name: 'Ollama - Local Models',
                description: 'Free models running locally on your computer',
                requiresKey: false,
            });
        }
    } catch (error) {
        console.log('Ollama check failed:', error);
    }

    // API options (always available if keys are provided)
    models.push(
        {
            type: MODEL_TYPES.API_OPENAI,
            name: 'OpenAI GPT-4',
            description: 'Requires API key',
            requiresKey: true,
        },
        {
            type: MODEL_TYPES.API_GEMINI,
            name: 'Google Gemini Pro',
            description: 'Requires API key',
            requiresKey: true,
        },
        {
            type: MODEL_TYPES.API_GROQ,
            name: 'Groq AI',
            description: 'Requires API key',
            requiresKey: true,
        }
    );

    return models;
}

/**
 * Generate text using the specified model type
 * @param {string} prompt - Input prompt
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, options = {}) {
    const {
        modelType = MODEL_TYPES.EMBEDDED,
        apiKey = null,
        modelName = null,
        maxLength = 100,
        temperature = 0.7,
        onProgress = null
    } = options;

    switch (modelType) {
        case MODEL_TYPES.EMBEDDED:
            return await generateWithEmbedded(prompt, {
                modelName: modelName || 'Xenova/TinyLlama-1.1B-Chat-v0.6',
                maxLength,
                temperature,
                onProgress
            });

        case MODEL_TYPES.LOCAL_OLLAMA:
            return await generateWithLocalModel(prompt, {
                model: modelName || 'llama3',
                maxTokens: maxLength,
                temperature
            });

        // Add other model type handlers as needed

        default:
            throw new Error(`Model type not implemented: ${modelType}`);
    }
}

/**
 * Check if the system can handle running the embedded model
 * @returns {Promise<Object>} System capability assessment
 */
export async function checkSystemCapability() {
    try {
        const memoryInfo = window.performance?.memory;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isLowEndDevice = navigator.deviceMemory && navigator.deviceMemory < 4;

        return {
            canRunEmbedded: !isMobile && !isLowEndDevice,
            hasMemoryInfo: !!memoryInfo,
            totalJSHeapSize: memoryInfo?.jsHeapSizeLimit || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            isLowEndDevice,
            browserSupported: true,
        };
    } catch (error) {
        console.error('Error checking system capability:', error);
        return {
            canRunEmbedded: false,
            error: error.message
        };
    }
}
