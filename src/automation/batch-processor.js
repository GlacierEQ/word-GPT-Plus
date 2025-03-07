/**
 * Word GPT Plus - Batch Processor
 * Handles batch operations across entire documents
 */

import ModelManager from '../model-manager.js';

class BatchProcessor {
    constructor() {
        this.modelManager = new ModelManager();

        // Configuration for batch processing
        this.config = {
            chunkSize: 5000, // Max characters per processing chunk
            maxConcurrent: 3, // Max concurrent operations
            pauseBetweenChunks: 500, // ms between chunks to prevent UI freezing
        };

        // Grammar rules for checking
        this.grammarRules = {
            passiveVoice: /\b(?:am|is|are|was|were|be|being|been)\s+(\w+ed|built|written|done|said|known|seen)\b/gi,
            wordiness: [
                { pattern: /in order to/gi, suggestion: 'to' },
                { pattern: /for the purpose of/gi, suggestion: 'for' },
                { pattern: /due to the fact that/gi, suggestion: 'because' },
                { pattern: /in spite of the fact that/gi, suggestion: 'although' },
                { pattern: /it is important to note that/gi, suggestion: 'note that' }
            ],
            redundancies: [
                { pattern: /\b(?:absolutely|completely|totally|entirely)\s+essential\b/gi, suggestion: 'essential' },
                { pattern: /\badvance\s+(?:planning|preparation)\b/gi, suggestion: 'planning' },
                { pattern: /\bcurrent\s+status\b/gi, suggestion: 'status' },
                { pattern: /\bend\s+result\b/gi, suggestion: 'result' }
            ]
        };
    }

    /**
     * Format all headings in document
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Formatting result
     */
    async formatHeadings(context, params = {}) {
        try {
            // Get all paragraphs that might be headings
            const body = context.document.body;
            const paragraphs = body.paragraphs;
            paragraphs.load(['items', 'style']);
            await context.sync();

            // Identify headings
            const headings = [];
            const paragraphItems = paragraphs.items;

            for (let i = 0; i < paragraphItems.length; i++) {
                const para = paragraphItems[i];
                const style = para.style;

                // Check if paragraph has heading style
                if (style && style.includes('Heading')) {
                    headings.push({ para, level: parseInt(style.replace('Heading ', '')) || 1, index: i });
                }
            }

            if (headings.length === 0) {
                return {
                    status: 'completed',
                    message: 'No headings found in document',
                    timestamp: new Date().toISOString()
                };
            }

            // Format each heading
            for (const heading of headings) {
                // Load text
                heading.para.load('text');
                await context.sync();

                // Format heading based on level
                switch (heading.level) {
                    case 1:
                        // Main heading - capitalize all words and make bold
                        heading.para.font.bold = true;
                        heading.para.font.size = 16;
                        break;
                    case 2:
                        // Subheading - capitalize major words
                        heading.para.font.bold = true;
                        heading.para.font.size = 14;
                        break;
                    case 3:
                        // Sub-subheading
                        heading.para.font.bold = true;
                        heading.para.font.italic = true;
                        heading.para.font.size = 13;
                        break;
                    default:
                        // Lower level headings
                        heading.para.font.bold = true;
                        heading.para.font.size = 12;
                }

                // Apply consistent color scheme if specified
                if (params.colorScheme) {
                    const colors = this._getColorScheme(params.colorScheme);
                    if (colors && colors[`level${heading.level}`]) {
                        heading.para.font.color = colors[`level${heading.level}`];
                    }
                }

                // Fix capitalization if needed
                if (params.fixCapitalization !== false) {
                    const headingText = heading.para.text;
                    const fixedText = this._fixHeadingCapitalization(headingText, heading.level);
                    if (fixedText !== headingText) {
                        heading.para.insertText(fixedText, 'Replace');
                    }
                }
            }

            await context.sync();

            return {
                status: 'completed',
                headingsFormatted: headings.length,
                levels: [...new Set(headings.map(h => h.level))].sort(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error formatting headings:', error);
            throw error;
        }
    }

    /**
     * Fix grammar throughout document
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Grammar check results
     */
    async fixGrammar(context, params = {}) {
        try {
            // Load document text
            const body = context.document.body;
            body.load('text');
            await context.sync();

            const fullText = body.text;

            // Check if document is too large for single processing
            if (fullText.length > this.config.chunkSize) {
                return this._processLargeDocument(context, params);
            }

            // For smaller documents, process everything at once
            const paragraphs = body.paragraphs;
            paragraphs.load('items');
            await context.sync();

            // Track statistics
            const stats = {
                passiveVoiceFound: 0,
                wordinessFixed: 0,
                redundanciesFixed: 0,
                spellingFixed: 0,
                paragraphsProcessed: paragraphs.items.length
            };

            // Process each paragraph
            for (const paragraph of paragraphs.items) {
                paragraph.load('text');
                await context.sync();

                const originalText = paragraph.text;

                // Skip empty paragraphs
                if (!originalText.trim()) continue;

                // Check for passive voice
                const passiveVoiceMatches = originalText.match(this.grammarRules.passiveVoice) || [];
                stats.passiveVoiceFound += passiveVoiceMatches.length;

                // Improve text by fixing common issues
                let improvedText = originalText;

                // Apply wordiness fixes
                this.grammarRules.wordiness.forEach(rule => {
                    const matches = improvedText.match(rule.pattern) || [];
                    stats.wordinessFixed += matches.length;

                    if (matches.length > 0) {
                        improvedText = improvedText.replace(rule.pattern, rule.suggestion);
                    }
                });

                // Apply redundancy fixes
                this.grammarRules.redundancies.forEach(rule => {
                    const matches = improvedText.match(rule.pattern) || [];
                    stats.redundanciesFixed += matches.length;

                    if (matches.length > 0) {
                        improvedText = improvedText.replace(rule.pattern, rule.suggestion);
                    }
                });

                // If text has changed, update paragraph
                if (improvedText !== originalText) {
                    paragraph.insertText(improvedText, 'Replace');
                }
            }

            // If AI grammar checking is enabled, process with model
            if (params.aiGrammarCheck !== false) {
                // Sample text for AI analysis (to avoid token limits)
                const sampleText = fullText.length > 2000 ?
                    fullText.substring(0, 2000) + '...' : fullText;

                const aiSuggestions = await this._getAIGrammarSuggestions(sampleText);
                stats.aiSuggestionsFound = aiSuggestions.length;

                // In a real implementation, we would locate and apply these suggestions
                console.log('AI grammar suggestions:', aiSuggestions);
            }

            await context.sync();

            return {
                status: 'completed',
                stats,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error fixing grammar:', error);
            throw error;
        }
    }

    /**
     * Process large document in chunks
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Processing results
     * @private
     */
    async _processLargeDocument(context, params) {
        // Divide document into manageable chunks
        const body = context.document.body;
        const paragraphs = body.paragraphs;
        paragraphs.load('items');
        await context.sync();

        // Calculate chunks
        const totalParagraphs = paragraphs.items.length;
        const chunks = [];
        let currentChunk = [];
        let currentChunkSize = 0;

        for (let i = 0; i < totalParagraphs; i++) {
            const para = paragraphs.items[i];
            para.load('text');
            await context.sync();

            const paraText = para.text;

            // Add to current chunk
            currentChunk.push({
                paragraph: para,
                text: paraText,
                index: i
            });
            currentChunkSize += paraText.length;

            // If chunk is full or last paragraph, add to chunks
            if (currentChunkSize >= this.config.chunkSize || i === totalParagraphs - 1) {
                chunks.push(currentChunk);
                currentChunk = [];
                currentChunkSize = 0;
            }
        }

        // Process stats
        const stats = {
            passiveVoiceFound: 0,
            wordinessFixed: 0,
            redundanciesFixed: 0,
            paragraphsProcessed: totalParagraphs,
            chunksProcessed: chunks.length
        };

        // Process each chunk with pause between to prevent UI freezing
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`Processing chunk ${i + 1} of ${chunks.length}`);

            // Process paragraphs in this chunk
            for (const item of chunk) {
                const paragraph = item.paragraph;
                const originalText = item.text;

                // Skip empty paragraphs
                if (!originalText.trim()) continue;

                // Check for passive voice
                const passiveVoiceMatches = originalText.match(this.grammarRules.passiveVoice) || [];
                stats.passiveVoiceFound += passiveVoiceMatches.length;

                // Fix common issues
                let improvedText = originalText;

                // Apply wordiness fixes
                this.grammarRules.wordiness.forEach(rule => {
                    const matches = improvedText.match(rule.pattern) || [];
                    stats.wordinessFixed += matches.length;

                    if (matches.length > 0) {
                        improvedText = improvedText.replace(rule.pattern, rule.suggestion);
                    }
                });

                // Apply redundancy fixes
                this.grammarRules.redundancies.forEach(rule => {
                    const matches = improvedText.match(rule.pattern) || [];
                    stats.redundanciesFixed += matches.length;

                    if (matches.length > 0) {
                        improvedText = improvedText.replace(rule.pattern, rule.suggestion);
                    }
                });

                // If text has changed, update paragraph
                if (improvedText !== originalText) {
                    paragraph.insertText(improvedText, 'Replace');
                }
            }

            await context.sync();

            // Pause between chunks
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, this.config.pauseBetweenChunks));
            }
        }

        return {
            status: 'completed',
            stats,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get AI grammar suggestions
     * @param {string} text - Text to analyze
     * @returns {Promise<Array>} Grammar suggestions
     * @private
     */
    async _getAIGrammarSuggestions(text) {
        try {
            const prompt = `
Analyze the following text for grammar issues, wordiness, and redundancies. 
Provide up to 5 specific suggestions for improvement.
Each suggestion should include:
1. The problematic text
2. The suggested correction
3. A brief explanation

Format your response as a JSON array of objects with 'problem', 'suggestion', and 'explanation' properties.

TEXT TO ANALYZE:
${text}
`;

            const response = await this.modelManager.generateText(prompt, {
                temperature: 0.3,
                detailed: true
            });

            // Try to parse JSON response
            try {
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.warn('Failed to parse AI grammar suggestions as JSON');
            }

            // Return empty array if parsing failed
            return [];

        } catch (error) {
            console.error('Error getting AI grammar suggestions:', error);
            return [];
        }
    }

    /**
     * Fix heading capitalization
     * @param {string} text - Heading text
     * @param {number} level - Heading level
     * @returns {string} Fixed heading text
     * @private
     */
    _fixHeadingCapitalization(text, level) {
        if (!text) return text;

        // Words to keep lowercase unless at beginning or end
        const minorWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor',
            'on', 'at', 'to', 'from', 'by', 'with', 'in', 'of', 'as']);

        // Level 1 headings: capitalize all words
        if (level === 1) {
            return text.split(/\s+/).map(word => {
                if (!word) return '';
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(' ');
        }

        // Level 2+ headings: title case with minor words lowercase
        const words = text.split(/\s+/);
        return words.map((word, index) => {
            if (!word) return '';

            // Always capitalize first and last word
            if (index === 0 || index === words.length - 1) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }

            // Keep minor words lowercase
            if (minorWords.has(word.toLowerCase())) {
                return word.toLowerCase();
            }

            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    /**
     * Get color scheme for headings
     * @param {string} schemeName - Color scheme name
     * @returns {Object} Colors by heading level
     * @private
     */
    _getColorScheme(schemeName) {
        const schemes = {
            blue: {
                level1: '#2F5597', // Dark blue
                level2: '#5B9BD5', // Medium blue
                level3: '#8EAADB', // Light blue
                level4: '#B4C6E7'  // Very light blue
            },
            grayscale: {
                level1: '#262626', // Near black
                level2: '#404040', // Dark gray
                level3: '#595959', // Medium gray
                level4: '#7F7F7F'  // Light gray
            },
            vibrant: {
                level1: '#7030A0', // Purple
                level2: '#C00000', // Red
                level3: '#00B050', // Green
                level4: '#0070C0'  // Blue
            }
        };

        return schemes[schemeName] || schemes.blue;
    }
}

// Create and export singleton instance
const batchProcessor = new BatchProcessor();
export default batchProcessor;
