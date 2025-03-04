/**
 * Utilities for connecting to local LLM models via Ollama
 */

/**
 * Base URL for Ollama API
 */
const OLLAMA_BASE_URL = 'http://localhost:11434/api';

/**
 * Available local models through Ollama
 */
export const LOCAL_MODELS = {
  LLAMA3_8B: 'llama3',
  LLAMA3_70B: 'llama3:70b',
  MISTRAL: 'mistral',
  PHI3: 'phi3',
  NOUS: 'nous'
};

/**
 * Check if Ollama is available locally
 * @returns {Promise<boolean>} Whether Ollama is available
 */
export async function isOllamaAvailable() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 2000 // Short timeout to check availability
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return Array.isArray(data.models) && data.models.length > 0;
  } catch (error) {
    console.log('Ollama not available locally:', error);
    return false;
  }
}

/**
 * Get available models from local Ollama instance
 * @returns {Promise<Array>} List of available models
 */
export async function getAvailableLocalModels() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/tags`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.status}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error getting local models:', error);
    return [];
  }
}

/**
 * Generate text using local Ollama model
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated text
 */
export async function generateWithLocalModel(prompt, options = {}) {
  const model = options.model || LOCAL_MODELS.LLAMA3_8B;
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 1000;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama generate failed: ${error}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating with local model:', error);
    throw error;
  }
}

/**
 * Stream text generation from local model
 * @param {string} prompt - The prompt to send
 * @param {function} onChunk - Callback for each chunk of text
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Complete generated text
 */
export async function streamGenerateWithLocalModel(prompt, onChunk, options = {}) {
  const model = options.model || LOCAL_MODELS.LLAMA3_8B;
  const temperature = options.temperature || 0.7;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama generate failed: ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete JSON objects from buffer
      let startPos = 0;
      let endPos;

      while ((endPos = buffer.indexOf('\n', startPos)) !== -1) {
        const line = buffer.substring(startPos, endPos).trim();
        startPos = endPos + 1;

        if (!line) continue;

        try {
          const chunk = JSON.parse(line);
          if (chunk.response) {
            fullText += chunk.response;
            onChunk(chunk.response);
          }
        } catch (e) {
          console.warn('Error parsing JSON chunk:', e);
        }
      }

      // Keep remainder for next iteration
      buffer = buffer.substring(startPos);
    }

    return fullText;
  } catch (error) {
    console.error('Error streaming from local model:', error);
    throw error;
  }
}
