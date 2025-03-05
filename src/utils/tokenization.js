/**
 * Simple tokenization utilities
 */

// Approximate token counts by provider/model
const TOKEN_RATIOS = {
    openai: 4, // ~4 chars per token for GPT models
    gemini: 4.5,
    claude: 4,
    deepseek: 3.8,
    llama: 3.5
};

/**
 * Estimate token count for a given text using character approximation
 * @param {string} text - Text to estimate tokens for
 * @param {string} provider - Provider name for more accurate estimation
 * @returns {number} Estimated token count
 */
export function estimateTokenCount(text, provider = 'openai') {
    if (!text) return 0;

    const ratio = TOKEN_RATIOS[provider.toLowerCase()] || 4;
    return Math.ceil(text.length / ratio);
}

/**
 * Truncate text to fit within a token limit
 * @param {string} text - Text to truncate
 * @param {number} maxTokens - Maximum token count
 * @param {string} provider - Provider name for more accurate estimation
 * @returns {string} Truncated text
 */
export function truncateToTokenLimit(text, maxTokens, provider = 'openai') {
    if (!text) return '';

    const estimatedTokens = estimateTokenCount(text, provider);
    if (estimatedTokens <= maxTokens) return text;

    const ratio = TOKEN_RATIOS[provider.toLowerCase()] || 4;
    const approximateCharLimit = maxTokens * ratio;

    // Leave a margin to account for estimation inaccuracy
    const safeCharLimit = Math.floor(approximateCharLimit * 0.9);

    return text.slice(0, safeCharLimit) + '...';
}

/**
 * Split text into chunks that fit within token limits
 * @param {string} text - Text to split
 * @param {number} maxTokensPerChunk - Maximum tokens per chunk
 * @param {string} provider - Provider name
 * @returns {Array<string>} Array of text chunks
 */
export function splitIntoChunks(text, maxTokensPerChunk = 2000, provider = 'openai') {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        const paragraphTokens = estimateTokenCount(paragraph, provider);
        const currentChunkTokens = estimateTokenCount(currentChunk, provider);

        if (paragraphTokens > maxTokensPerChunk) {
            // If a single paragraph is too large, we need to split it
            if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = '';
            }

            // Split the paragraph into sentences
            const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
            let sentenceChunk = '';

            for (const sentence of sentences) {
                const sentenceTokens = estimateTokenCount(sentence, provider);
                const sentenceChunkTokens = estimateTokenCount(sentenceChunk, provider);

                if (sentenceTokens > maxTokensPerChunk) {
                    // This is a very long sentence, we'll have to truncate it
                    if (sentenceChunk) {
                        chunks.push(sentenceChunk);
                        sentenceChunk = '';
                    }

                    // Add truncated version of the sentence
                    chunks.push(truncateToTokenLimit(sentence, maxTokensPerChunk, provider));
                } else if (sentenceChunkTokens + sentenceTokens <= maxTokensPerChunk) {
                    sentenceChunk += sentence;
                } else {
                    chunks.push(sentenceChunk);
                    sentenceChunk = sentence;
                }
            }

            if (sentenceChunk) {
                chunks.push(sentenceChunk);
            }
        } else if (currentChunkTokens + paragraphTokens <= maxTokensPerChunk) {
            // Add paragraph to current chunk
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        } else {
            // Start a new chunk
            chunks.push(currentChunk);
            currentChunk = paragraph;
        }
    }

    // Add the last chunk if it's not empty
    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}
