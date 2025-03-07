/**
 * Word GPT Plus - Content Generator
 * Generates various types of content for Word documents
 */

import ModelManager from '../model-manager.js';

class ContentGenerator {
    constructor() {
        this.modelManager = new ModelManager();

        // Content generation templates
        this.templates = {
            outline: {
                academic: "Create a detailed academic outline for research on {topic} with {depth} levels of hierarchy. Use standard academic outline format.",
                business: "Create a professional business outline for a report on {topic} with {depth} levels of detail. Focus on actionable insights and clear structure.",
                creative: "Create a creative outline for content about {topic} with {depth} levels of detail. Use engaging headings and innovative structure."
            },

            paragraph: {
                formal: "Write a formal paragraph about {topic} that would be appropriate in a professional or academic context.",
                persuasive: "Write a persuasive paragraph about {topic} that convinces the reader of the main argument.",
                descriptive: "Write a rich, descriptive paragraph about {topic} with sensory details and vivid imagery."
            },

            section: {
                introduction: "Write an introduction section about {topic} that engages the reader and provides necessary background information.",
                conclusion: "Write a conclusion section that summarizes the key points about {topic} and provides closure.",
                analysis: "Write an analytical section that examines {topic} from multiple perspectives with supporting evidence."
            }
        };
    }

    /**
     * Generate a document outline
     * @param {Object} context - Word context
     * @param {Object} params - Parameters (topic, depth, style)
     * @returns {Promise<Object>} Generated outline and insertion result
     */
    async generateOutline(context, params) {
        try {
            const { topic, depth = 2, style = 'business' } = params;

            if (!topic) {
                throw new Error('Topic is required for outline generation');
            }

            // Get appropriate template
            const template = this.templates.outline[style] || this.templates.outline.business;

            // Create AI prompt
            const prompt = template
                .replace('{topic}', topic)
                .replace('{depth}', depth);

            console.log(`Generating ${style} outline about "${topic}" with depth ${depth}`);

            // Generate outline content using AI
            const outlineContent = await this.modelManager.generateText(prompt, {
                temperature: 0.7,
                detailed: true
            });

            // Process outline for insertion
            const formattedOutline = this._formatOutlineForInsertion(outlineContent);

            // Insert the outline at the current selection
            const insertionResult = await this._insertOutlineIntoDocument(context, formattedOutline);

            return {
                raw: outlineContent,
                formatted: formattedOutline,
                insertionResult,
                topic,
                style,
                depth,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating outline:', error);
            throw error;
        }
    }

    /**
     * Expand bullet points into full paragraphs
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Expansion result
     */
    async expandBulletPoints(context, params = {}) {
        try {
            // Get selected text from document
            const selection = context.document.getSelection();
            selection.load('text');
            await context.sync();

            const bulletText = selection.text.trim();

            if (!bulletText) {
                throw new Error('No text selected for expansion');
            }

            // Check if text contains bullet points
            if (!this._containsBulletPoints(bulletText)) {
                throw new Error('Selected text does not appear to contain bullet points');
            }

            // Extract bullet points
            const bulletPoints = this._extractBulletPoints(bulletText);

            if (bulletPoints.length === 0) {
                throw new Error('No valid bullet points found');
            }

            // Create prompt for expansion
            const prompt = `
Expand the following bullet points into well-developed paragraphs. 
Each bullet point should become a cohesive paragraph that fully explains the point.
Maintain the original meaning but add relevant details, examples, or context.

BULLET POINTS:
${bulletPoints.join('\n')}

INSTRUCTIONS:
- Create a separate paragraph for each bullet point
- Begin each paragraph with a strong topic sentence 
- Provide supporting details, examples, and explanation
- Use transitions for flow between paragraphs
- Write in ${params.tone || 'a clear, professional'} tone
- Each paragraph should be 3-5 sentences in length
`;

            // Generate expanded content
            const expandedContent = await this.modelManager.generateText(prompt, {
                temperature: 0.7,
                maxTokens: Math.max(bulletPoints.length * 200, 800)
            });

            // Insert expanded content
            selection.insertText(expandedContent, 'Replace');
            await context.sync();

            return {
                originalBulletCount: bulletPoints.length,
                expandedContent,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error expanding bullet points:', error);
            throw error;
        }
    }

    /**
     * Generate a section of content
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Generation result
     */
    async generateSection(context, params) {
        try {
            const { sectionType = 'introduction', topic, paragraphCount = 3, tone = 'professional' } = params;

            if (!topic) {
                throw new Error('Topic is required for section generation');
            }

            // Get template for section type
            const template = this.templates.section[sectionType] ||
                `Write a ${sectionType} section about {topic} with ${paragraphCount} paragraphs.`;

            // Create prompt
            const prompt = `
${template.replace('{topic}', topic)}

Additional instructions:
- Write ${paragraphCount} well-developed paragraphs
- Use a ${tone} tone
- Include relevant details and context
- Ensure smooth transitions between paragraphs
- Create a cohesive section that flows naturally
`;

            const sectionContent = await this.modelManager.generateText(prompt, {
                temperature: 0.7,
                detailed: true,
                maxTokens: paragraphCount * 300
            });

            // Get current selection
            const selection = context.document.getSelection();

            // Insert the generated content
            selection.insertText(sectionContent, 'Replace');
            await context.sync();

            return {
                sectionType,
                topic,
                paragraphCount,
                tone,
                content: sectionContent,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating section:', error);
            throw error;
        }
    }

    /**
     * Format outline for insertion into Word document
     * @private
     */
    _formatOutlineForInsertion(outlineText) {
        // Clean up the text
        let lines = outlineText.split('\n').map(line => line.trim()).filter(Boolean);

        // Detect outline format (I., A., 1., •, -, etc.)
        const formatted = [];
        let currentLevel = 0;

        lines.forEach(line => {
            // Try to detect the outline level from common formatting patterns
            let level = 0;

            if (/^[IVX]+\.\s/.test(line)) { // Roman numerals (I., II., etc.)
                level = 1;
                line = line.replace(/^[IVX]+\.\s/, '');
            } else if (/^[A-Z]\.\s/.test(line)) { // Capital letters (A., B., etc.)
                level = 2;
                line = line.replace(/^[A-Z]\.\s/, '');
            } else if (/^\d+\.\s/.test(line)) { // Numbers (1., 2., etc.)
                level = 3;
                line = line.replace(/^\d+\.\s/, '');
            } else if (/^[a-z]\.\s/.test(line)) { // Lowercase letters (a., b., etc.)
                level = 4;
                line = line.replace(/^[a-z]\.\s/, '');
            } else if (/^[•\-]\s/.test(line)) { // Bullets or dashes
                level = 5;
                line = line.replace(/^[•\-]\s/, '');
            } else {
                // If no marker detected, use indentation as a fallback
                const leadingSpaces = line.search(/\S/);
                level = Math.floor(leadingSpaces / 2) + 1;
                line = line.trim();
            }

            // Clean up the line and add to formatted result
            formatted.push({
                text: line.trim(),
                level: Math.min(level, 9) // Word supports up to 9 levels
            });
        });

        return formatted;
    }

    /**
     * Insert outline into document with proper formatting
     * @private
     */
    async _insertOutlineIntoDocument(context, formattedOutline) {
        // Get the selection
        const selection = context.document.getSelection();
        selection.clear(); // Clear the selection
        await context.sync();

        // Insert each outline item with appropriate heading style
        for (const item of formattedOutline) {
            // Insert the text
            const range = selection.insertText(item.text + '\n', 'After');

            // Set the style based on level
            if (item.level <= 3) {
                // Use heading styles for top 3 levels
                range.style = `Heading ${item.level}`;
            } else {
                // Use normal style with list formatting for deeper levels
                range.style = 'Normal';
                // In a real implementation, we would also apply list formatting here
            }

            await context.sync();
        }

        return { success: true, itemCount: formattedOutline.length };
    }

    /**
     * Check if text contains bullet points
     * @private
     */
    _containsBulletPoints(text) {
        // Check for various bullet point formats
        const bulletPatterns = [
            /^[•\-*]\s+/m,          // Bullet, dash, or asterisk
            /^\d+\.\s+/m,           // Numbered (1. 2. etc)
            /^[a-zA-Z]\)\s+/m,      // Letter with parenthesis (a) b) etc)
            /^[a-zA-Z]\.\s+/m,      // Letter with dot (a. b. etc)
            /^\[\s*[xX\s]\s*\]\s+/m // Checkbox format
        ];

        return bulletPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Extract bullet points from text
     * @private
     */
    _extractBulletPoints(text) {
        const lines = text.split('\n');
        const bulletPoints = [];

        // Regular expressions for different bullet formats
        const bulletRegexps = [
            /^[•\-*]\s+(.+)$/,       // Bullet, dash, or asterisk
            /^\d+\.\s+(.+)$/,        // Numbered (1. 2. etc)
            /^[a-zA-Z]\)\s+(.+)$/,   // Letter with parenthesis (a) b) etc)
            /^[a-zA-Z]\.\s+(.+)$/,   // Letter with dot (a. b. etc)
            /^\[\s*[xX\s]\s*\]\s+(.+)$/ // Checkbox format
        ];

        // Extract content from each bullet point
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            // Check each bullet format
            for (const regexp of bulletRegexps) {
                const match = trimmedLine.match(regexp);
                if (match) {
                    bulletPoints.push(match[1].trim());
                    break;
                }
            }
        });

        return bulletPoints;
    }
}

// Create and export singleton instance
const contentGenerator = new ContentGenerator();
export default contentGenerator;
