/**
 * Utilities for running lightweight quantized models directly in Word-GPT-Plus
 * with no external API requirements or costs
 */

import { pipeline, env } from '@xenova/transformers';

// Configure the transformers.js library
env.allowLocalModels = false; // Use remote CDN-hosted models by default
env.useFS = false; // Running in browser, no filesystem access
env.allowRemoteModels = true; // Use transformers.js CDN

// Available embedded models
export const EMBEDDED_MODELS = {
    TEXT_GENERATION: {
        TINY_LLAMA: 'Xenova/TinyLlama-1.1B-Chat-v0.6',
        FLAN_T5_SMALL: 'Xenova/flan-t5-small',
        FALCON_SMALL: 'Xenova/falcon-rw-1b-instruct',
        DISTILGPT2: 'Xenova/distilgpt2'
    },
    SUMMARIZATION: {
        BART_SMALL: 'Xenova/bart-small',
        FLAN_T5_SMALL_SUMMARIZER: 'Xenova/flan-t5-small'
    },
    TEXT_CLASSIFICATION: {
        DISTILBERT: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    },
    EMBEDDING: {
        ALL_MINILM: 'Xenova/all-MiniLM-L6-v2'
    }
};

// Cache for loaded models to avoid reloading
const modelCache = new Map();

/**
 * Check if browser supports WebGPU for hardware acceleration
 * @returns {boolean} Whether WebGPU is supported
 */
export async function checkWebGPUSupport() {
    if ('gpu' in navigator) {
        try {
            const adapter = await navigator.gpu.requestAdapter();
            return !!adapter;
        } catch (e) {
            console.log('WebGPU supported but failed to get adapter', e);
            return false;
        }
    }
    return false;
}

/**
 * Load a model for text generation tasks
 * @param {string} modelName - Name of the model to load
 * @param {function} onProgress - Progress callback
 * @returns {Promise<Object>} Loaded model
 */
export async function loadTextGenerator(modelName = EMBEDDED_MODELS.TEXT_GENERATION.TINY_LLAMA, onProgress) {
    if (modelCache.has(modelName)) {
        return modelCache.get(modelName);
    }

    const generator = await pipeline('text-generation', modelName, {
        progress_callback: onProgress,
        quantized: true // Use 8-bit quantization for efficiency
    });

    modelCache.set(modelName, generator);
    return generator;
}

/**
 * Load a model for summarization tasks
 * @param {string} modelName - Name of the model to load
 * @param {function} onProgress - Progress callback
 * @returns {Promise<Object>} Loaded model
 */
export async function loadSummarizer(modelName = EMBEDDED_MODELS.SUMMARIZATION.BART_SMALL, onProgress) {
    if (modelCache.has(modelName)) {
        return modelCache.get(modelName);
    }

    const summarizer = await pipeline('summarization', modelName, {
        progress_callback: onProgress,
        quantized: true
    });

    modelCache.set(modelName, summarizer);
    return summarizer;
}

/**
 * Generate text using an embedded model
 * @param {string} prompt - Text prompt
 * @param {Object} options - Generation options 
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, options = {}) {
    const {
        modelName = EMBEDDED_MODELS.TEXT_GENERATION.TINY_LLAMA,
        maxLength = 100,
        temperature = 0.7,
        topP = 0.9,
        onProgress = null,
        onModelLoadProgress = null
    } = options;

    try {
        const generator = await loadTextGenerator(modelName, onModelLoadProgress);

        const result = await generator(prompt, {
            max_new_tokens: maxLength,
            temperature: temperature,
            top_p: topP,
            do_sample: true,
            callback_function: onProgress // For token-by-token generation
        });

        return result[0].generated_text;
    } catch (error) {
        console.error('Error generating text with embedded model:', error);
        throw error;
    }
}

/**
 * Summarize text using an embedded model
 * @param {string} text - Text to summarize
 * @param {Object} options - Summarization options
 * @returns {Promise<string>} Summarized text 
 */
export async function summarizeText(text, options = {}) {
    const {
        modelName = EMBEDDED_MODELS.SUMMARIZATION.BART_SMALL,
        maxLength = 100,
        minLength = 30,
        onProgress = null
    } = options;

    try {
        const summarizer = await loadSummarizer(modelName, onProgress);

        const result = await summarizer(text, {
            max_length: maxLength,
            min_length: minLength,
        });

        return result[0].summary_text;
    } catch (error) {
        console.error('Error summarizing text with embedded model:', error);
        throw error;
    }
}

/**
 * Get estimated memory requirements for a model
 * @param {string} modelName - Name of the model
 * @returns {Object} Memory requirements
 */
export function getModelMemoryRequirements(modelName) {
    // Approximate memory requirements in MB
    const memoryMap = {
        [EMBEDDED_MODELS.TEXT_GENERATION.TINY_LLAMA]: 600,
        [EMBEDDED_MODELS.TEXT_GENERATION.FLAN_T5_SMALL]: 300,
        [EMBEDDED_MODELS.TEXT_GENERATION.FALCON_SMALL]: 500,
        [EMBEDDED_MODELS.TEXT_GENERATION.DISTILGPT2]: 350,
        [EMBEDDED_MODELS.SUMMARIZATION.BART_SMALL]: 250,
        [EMBEDDED_MODELS.SUMMARIZATION.FLAN_T5_SMALL_SUMMARIZER]: 300,
        [EMBEDDED_MODELS.TEXT_CLASSIFICATION.DISTILBERT]: 260,
        [EMBEDDED_MODELS.EMBEDDING.ALL_MINILM]: 90
    };

    return {
        estimatedMemoryMB: memoryMap[modelName] || 500,
        recommendedRAM: memoryMap[modelName] > 400 ? '8GB+' : '4GB+',
        canRunInBackground: memoryMap[modelName] < 300
    };
}

/**
 * Unload models to free up memory
 * @param {Array<string>} modelNames - Names of models to unload (empty for all)
 */
export function unloadModels(modelNames = []) {
    if (modelNames.length === 0) {
        // Unload all models
        modelCache.clear();
        if (typeof window !== 'undefined' && window.gc) {
            window.gc(); // Request garbage collection if available
        }
        return;
    }

    // Unload specific models
    modelNames.forEach(name => {
        if (modelCache.has(name)) {
            modelCache.delete(name);
        }
    });
}
