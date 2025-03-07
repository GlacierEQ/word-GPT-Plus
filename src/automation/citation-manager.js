/**
 * Word GPT Plus - Citation Manager
 * Handles citations and bibliography in documents
 */

import ModelManager from '../model-manager.js';

class CitationManager {
    constructor() {
        this.modelManager = new ModelManager();

        // Citation style templates
        this.citationStyles = {
            APA: {
                name: 'APA Style (7th Edition)',
                journal: '{authors} ({year}). {title}. {journal}, {volume}({issue}), {pages}.',
                book: '{authors} ({year}). {title}. {publisher}.',
                website: '{authors} ({year}). {title}. {website}. Retrieved from {url}'
            },
            MLA: {
                name: 'MLA Style (9th Edition)',
                journal: '{authors}. "{title}." {journal}, vol. {volume}, no. {issue}, {year}, pp. {pages}.',
                book: '{authors}. {title}. {publisher}, {year}.',
                website: '{authors}. "{title}." {website}, {year}, {url}.'
            },
            Chicago: {
                name: 'Chicago Style (17th Edition)',
                journal: '{authors}. "{title}." {journal} {volume}, no. {issue} ({year}): {pages}.',
                book: '{authors}. {title}. {publisher}, {year}.',
                website: '{authors}. "{title}." {website}, {year}. {url}.'
            },
            Harvard: {
                name: 'Harvard Style',
                journal: '{authors} ({year}) \'{title}\', {journal}, {volume}({issue}), pp. {pages}.',
                book: '{authors} ({year}) {title}. {publisher}.',
                website: '{authors} ({year}) {title}. Available at: {url} (Accessed: {accessDate}).'
            }
        };

        // Track found citations
        this.documentCitations = {};
    }

    /**
     * Format citations in a document
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Formatting result
     */
    async formatCitations(context, params = {}) {
        try {
            const { style = 'APA' } = params;

            // Validate citation style
            if (!this.citationStyles[style]) {
                throw new Error(`Unknown citation style: ${style}`);
            }

            const citationStyle = this.citationStyles[style];

            // Get document body
            const body = context.document.body;
            body.load('text');
            await context.sync();

            // Find potential citations in the document
            const potentialCitations = await this._findPotentialCitations(context);

            if (potentialCitations.length === 0) {
                return {
                    status: 'completed',
                    citationsFound: 0,
                    message: 'No citations found in document',
                    timestamp: new Date().toISOString()
                };
            }

            // Process each potential citation
            const processedCitations = [];

            for (const citation of potentialCitations) {
                // Load the range text
                citation.range.load('text');
                await context.sync();

                const citationText = citation.range.text;
                const formattedCitation = await this._formatCitation(citationText, style);

                if (formattedCitation && formattedCitation !== citationText) {
                    // Replace the citation with the formatted version
                    citation.range.insertText(formattedCitation, 'Replace');
                    processedCitations.push({
                        original: citationText,
                        formatted: formattedCitation
                    });
                }
            }

            await context.sync();

            // Save processed citations for bibliography generation
            this.documentCitations = {
                style,
                citations: processedCitations
            };

            return {
                status: 'completed',
                style: citationStyle.name,
                citationsFound: potentialCitations.length,
                citationsFormatted: processedCitations.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error formatting citations:', error);
            throw error;
        }
    }

    /**
     * Generate a bibliography based on citations in the document
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Bibliography generation result
     */
    async generateBibliography(context, params = {}) {
        try {
            // Get style from params or use stored style from previous formatting
            const style = params.style || (this.documentCitations.style || 'APA');

            // Find citations in document if we don't have them already
            let documentCitations = this.documentCitations.citations || [];
            if (documentCitations.length === 0) {
                const potentialCitations = await this._findPotentialCitations(context);

                // Extract text from potential citations
                for (const citation of potentialCitations) {
                    citation.range.load('text');
                    await context.sync();

                    documentCitations.push({
                        original: citation.range.text
                    });
                }
            }

            if (documentCitations.length === 0) {
                return {
                    status: 'completed',
                    message: 'No citations found to generate bibliography',
                    timestamp: new Date().toISOString()
                };
            }

            // Use AI to generate a properly formatted bibliography
            const prompt = `
Generate a bibliography in ${style} format based on these citations:

${documentCitations.map(c => c.original || c).join('\n\n')}

FORMAT RULES:
- Use proper ${style} format
- Sort entries alphabetically by author's last name
- Format all entries consistently
- Include all available citation information
- Return ONLY the bibliography entries, one per line
`;

            const bibliographyText = await this.modelManager.generateText(prompt, {
                temperature: 0.3,
                detailed: true
            });

            // Insert the bibliography at the end of the document or at the cursor
            let insertLocation;
            if (params.position === 'end') {
                // Insert at end of document
                insertLocation = context.document.body.insertParagraph("Bibliography", "End");
            } else {
                // Insert at current selection
                const selection = context.document.getSelection();
                selection.insertParagraph("Bibliography", "Before");
                insertLocation = selection;
            }

            // Format the heading
            insertLocation.font.bold = true;
            insertLocation.font.size = 16;

            // Insert bibliography text
            const biblioContent = insertLocation.insertParagraph(bibliographyText, "After");

            // Format bibliography with hanging indent if possible
            try {
                biblioContent.paragraphs.load('items');
                await context.sync();

                // Apply hanging indent to each paragraph
                for (const para of biblioContent.paragraphs.items) {
                    para.firstLineIndent = -24;
                    para.leftIndent = 24;
                }
            } catch (error) {
                console.warn('Could not apply hanging indent:', error);
            }

            await context.sync();

            return {
                status: 'completed',
                style,
                citationCount: documentCitations.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error generating bibliography:', error);
            throw error;
        }
    }

    /**
     * Find potential citations in the document
     * @param {Object} context - Word context
     * @returns {Promise<Object[]>} Potential citations with their ranges
     * @private
     */
    async _findPotentialCitations(context) {
        // Citation patterns to search for
        const citationPatterns = [
            // APA style in-text citations
            '\\([A-Za-z]+\\s*(&\\s*[A-Za-z]+)?\\s*,\\s*\\d{4}\\)',
            // MLA style
            '\\([A-Za-z]+\\s+\\d+\\)',
            // Harvard style
            '\\([A-Za-z]+\\s+\\d{4}\\)'
        ];

        const citationRanges = [];

        // Search the document for each pattern
        for (const pattern of citationPatterns) {
            const searchResults = context.document.body.search(pattern, {
                matchWildcards: true
            });
            searchResults.load('items');
            await context.sync();

            // Add each result to our list
            searchResults.items.forEach(range => {
                citationRanges.push({ range, pattern });
            });
        }

        // Search for bracketed citations [1], [2], etc.
        const bracketedSearch = context.document.body.search('\\[[0-9]+\\]', {
            matchWildcards: true
        });
        bracketedSearch.load('items');
        await context.sync();

        bracketedSearch.items.forEach(range => {
            citationRanges.push({ range, pattern: 'bracketed' });
        });

        return citationRanges;
    }

    /**
     * Format a citation according to the specified style
     * @param {string} citationText - Text of the citation
     * @param {string} style - Citation style
     * @returns {Promise<string>} Formatted citation
     * @private
     */
    async _formatCitation(citationText, style) {
        // Extract key information from the citation text
        const info = this._extractCitationInfo(citationText);

        if (!info || !info.author) {
            // If we couldn't extract information, return original
            return citationText;
        }

        // Format according to style
        let formatted;
        switch (style) {
            case 'APA':
                formatted = `(${info.author}, ${info.year})`;
                break;
            case 'MLA':
                formatted = `(${info.author} ${info.pages || info.year})`;
                break;
            case 'Chicago':
                formatted = `(${info.author} ${info.year})`;
                break;
            case 'Harvard':
                formatted = `(${info.author}, ${info.year})`;
                break;
            default:
                formatted = citationText;
        }

        return formatted;
    }

    /**
     * Extract citation information from text
     * @param {string} text - Citation text
     * @returns {Object} Citation information
     * @private
     */
    _extractCitationInfo(text) {
        // Remove parentheses if present
        const cleanText = text.replace(/[()[\]]/g, '').trim();

        // Try different patterns

        // APA style: Author, Year
        const apaMatch = cleanText.match(/([A-Za-z]+\s*(?:&\s*[A-Za-z]+)?)\s*,\s*(\d{4})/);
        if (apaMatch) {
            return {
                author: apaMatch[1],
                year: apaMatch[2]
            };
        }

        // MLA style: Author Page
        const mlaMatch = cleanText.match(/([A-Za-z]+)\s+(\d+)/);
        if (mlaMatch) {
            return {
                author: mlaMatch[1],
                pages: mlaMatch[2]
            };
        }

        // Numeric citation [1]
        const numMatch = cleanText.match(/(\d+)/);
        if (numMatch) {
            return {
                index: numMatch[1]
            };
        }

        return null;
    }

    /**
     * Parse a citation string into structured data
     * @param {string} citation - Citation string
     * @returns {Object} Parsed citation
     * @private
     */
    async _parseCitation(citation) {
        // For complex parsing, we can use the AI model to help extract information
        const prompt = `
Parse the following citation and extract the structured information:
${citation}

Return ONLY a JSON object with these fields (leave empty if not available):
- type: "book", "journal", "website", or "other"
- authors: Author names separated by commas
- year: Publication year
- title: Title of the work
- journal: Journal name (if applicable)
- volume: Volume number (if applicable)
- issue: Issue number (if applicable)
- pages: Page range (if applicable)
- publisher: Publisher name (if applicable)
- url: URL (if applicable)
`;

        try {
            const response = await this.modelManager.generateText(prompt, {
                temperature: 0.1,
                format: 'json',
                maxTokens: 500
            });

            // Try to parse JSON response
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.warn('Failed to parse citation as JSON');
            }

            // Fallback to original citation
            return { original: citation };
        } catch (error) {
            console.error('Error parsing citation:', error);
            return { original: citation };
        }
    }
}

// Create and export singleton instance
const citationManager = new CitationManager();
export default citationManager;
