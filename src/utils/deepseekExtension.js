/**
 * DeepSeek Pro Chrome Extension integration for Word-GPT-Plus
 * Provides advanced capabilities including coding, RAG, web search and research
 */

// Chrome extension ID for DeepSeek Pro
export const DEEPSEEK_EXTENSION_ID = 'bifepkinbmimkekdmcnhlkbhmbgecfme';

/**
 * Check if DeepSeek Pro extension is available
 * @returns {Promise<boolean>} True if extension is available
 */
export async function isDeepSeekExtensionAvailable() {
    try {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            return false;
        }

        return new Promise((resolve) => {
            chrome.runtime.sendMessage(
                DEEPSEEK_EXTENSION_ID,
                { action: 'ping' },
                response => {
                    resolve(!!response && response.status === 'ok');
                }
            );

            // If no response in 500ms, assume extension is not available
            setTimeout(() => resolve(false), 500);
        });
    } catch (error) {
        console.log('Error checking DeepSeek Extension availability:', error);
        return false;
    }
}

/**
 * Connect to DeepSeek Pro extension
 * @returns {Promise<Object>} Connection status
 */
export async function connectToDeepSeekExtension() {
    if (!await isDeepSeekExtensionAvailable()) {
        throw new Error('DeepSeek Pro extension is not available. Please install it from the Chrome Web Store.');
    }

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            DEEPSEEK_EXTENSION_ID,
            { action: 'connect', source: 'word-gpt-plus' },
            response => {
                if (response && response.status === 'ok') {
                    resolve({ connected: true, version: response.version });
                } else {
                    reject(new Error('Failed to connect to DeepSeek Pro extension'));
                }
            }
        );
    });
}

/**
 * Execute a code snippet using the DeepSeek Pro extension
 * @param {string} code - Code to execute
 * @param {string} language - Programming language
 * @returns {Promise<Object>} Execution result
 */
export async function executeCode(code, language) {
    return await sendExtensionMessage({
        action: 'execute_code',
        code,
        language
    });
}

/**
 * Search the web using DeepSeek Pro extension
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
export async function searchWeb(query, options = {}) {
    return await sendExtensionMessage({
        action: 'web_search',
        query,
        numResults: options.numResults || 5,
        searchEngine: options.searchEngine || 'google'
    });
}

/**
 * Retrieve context from documents using RAG
 * @param {string} query - Query for document retrieval
 * @param {Array<Object>} documents - Documents to search through
 * @returns {Promise<Object>} Retrieved context
 */
export async function retrieveContext(query, documents) {
    return await sendExtensionMessage({
        action: 'rag_retrieve',
        query,
        documents
    });
}

/**
 * Perform deep research on a topic
 * @param {string} topic - Research topic
 * @param {Object} options - Research options
 * @returns {Promise<Object>} Research results
 */
export async function performResearch(topic, options = {}) {
    return await sendExtensionMessage({
        action: 'deep_research',
        topic,
        depth: options.depth || 'medium',
        sources: options.sources || ['academic', 'web'],
        maxResults: options.maxResults || 10
    });
}

/**
 * Send a message to the DeepSeek Pro extension
 * @param {Object} message - Message to send
 * @returns {Promise<Object>} Response from extension
 */
async function sendExtensionMessage(message) {
    if (!await isDeepSeekExtensionAvailable()) {
        throw new Error('DeepSeek Pro extension is not available');
    }

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            DEEPSEEK_EXTENSION_ID,
            message,
            response => {
                if (response && response.status === 'ok') {
                    resolve(response.data);
                } else {
                    reject(new Error(response?.error || 'Failed to communicate with DeepSeek Pro extension'));
                }
            }
        );

        // Timeout after 30 seconds
        setTimeout(() => reject(new Error('Request to DeepSeek Pro extension timed out')), 30000);
    });
}

/**
 * Get capabilities information from the DeepSeek Pro extension
 * @returns {Promise<Object>} Extension capabilities
 */
export async function getExtensionCapabilities() {
    try {
        return await sendExtensionMessage({ action: 'get_capabilities' });
    } catch (error) {
        console.error('Error getting DeepSeek extension capabilities:', error);
        return {
            webSearch: false,
            codeExecution: false,
            rag: false,
            research: false,
            version: 'unknown'
        };
    }
}
