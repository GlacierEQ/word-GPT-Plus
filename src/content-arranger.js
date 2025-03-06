/**
 * Word GPT Plus - Content Arranger
 * Provides advanced content organization and arrangement capabilities
 */

class ContentArranger {
    constructor() {
        // Available arrangement patterns
        this.arrangementPatterns = {
            columns: this.arrangeInColumns.bind(this),
            sections: this.arrangeInSections.bind(this),
            bullets: this.convertToBulletList.bind(this),
            numbers: this.convertToNumberedList.bind(this),
            table: this.convertToTable.bind(this),
            reorganize: this.reorganizeByTopic.bind(this)
        };

        // Topic detection and reorganization methods
        this.topicDetectionMethods = {
            keyword: this.detectTopicsByKeywords.bind(this),
            semantic: this.detectTopicsSemantically.bind(this),
            heading: this.detectTopicsByHeadings.bind(this)
        };
    }

    /**
     * Apply an arrangement pattern to document content
     * @param {string} patternName - Name of arrangement pattern
     * @param {Object} options - Arrangement options
     * @returns {Promise<boolean>} Success status
     */
    async applyArrangement(patternName, options = {}) {
        try {
            if (!this.arrangementPatterns[patternName]) {
                throw new Error(`Arrangement pattern '${patternName}' not found`);
            }

            return await this.arrangementPatterns[patternName](options);
        } catch (error) {
            console.error(`Error applying arrangement '${patternName}':`, error);
            throw error;
        }
    }

    /**
     * Arrange content in columns
     * @param {Object} options - Column options
     * @returns {Promise<boolean>} Success status
     */
    async arrangeInColumns(options = { columns: 2 }) {
        return Word.run(async context => {
            // Get current selection or whole document if no selection
            const range = context.document.getSelection();
            range.load('text');

            await context.sync();

            // Create section with columns
            range.insertBreak(Word.BreakType.sectionContinuous, Word.InsertLocation.after);
            const newSection = range.getNext();

            // Set columns
            newSection.sections.getFirst().sectionFormat.columnCount = options.columns;

            await context.sync();
            return true;
        });
    }

    /**
     * Arrange content in sections with headings
     * @param {Object} options - Section options
     * @returns {Promise<boolean>} Success status
     */
    async arrangeInSections(options = {}) {
        return Word.run(async context => {
            // Get document body
            const body = context.document.body;
            body.load('text');

            await context.sync();

            const text = body.text;

            // Look for natural section breaks (e.g., double line breaks)
            const sections = text.split('\n\n');

            if (sections.length <= 1) {
                console.log('Not enough content to arrange in sections');
                return false;
            }

            // Clear the document
            body.clear();

            // Insert each section with a heading
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i].trim();
                if (!section) continue;

                // Add a heading
                const headingText = options.headings && options.headings[i]
                    ? options.headings[i]
                    : `Section ${i + 1}`;

                body.insertParagraph(headingText, Word.InsertLocation.end).styleBuiltIn = Word.Style.heading2;

                // Add the section content
                body.insertParagraph(section, Word.InsertLocation.end);

                // Add a separator except after the last section
                if (i < sections.length - 1) {
                    body.insertHorizontalLine(Word.InsertLocation.end);
                }
            }

            await context.sync();
            return true;
        });
    }

    /**
     * Convert text to bullet list
     * @param {Object} options - Bullet list options
     * @returns {Promise<boolean>} Success status
     */
    async convertToBulletList(options = {}) {
        return Word.run(async context => {
            // Get current selection
            const range = context.document.getSelection();
            range.load('text');

            await context.sync();

            // Check if there's any text selected
            if (!range.text.trim()) {
                console.log('No text selected to convert to bullet list');
                return false;
            }

            // Split into lines
            const lines = range.text.split('\n').filter(line => line.trim());

            // Clear the selection
            range.clear();

            // Create bullet list
            for (const line of lines) {
                const paragraph = range.insertParagraph(line, Word.InsertLocation.before);
                paragraph.setBullet(Word.BulletType.solid, 1);
            }

            await context.sync();
            return true;
        });
    }

    /**
     * Convert text to numbered list
     * @param {Object} options - Numbered list options
     * @returns {Promise<boolean>} Success status
     */
    async convertToNumberedList(options = {}) {
        return Word.run(async context => {
            // Get current selection
            const range = context.document.getSelection();
            range.load('text');

            await context.sync();

            // Check if there's any text selected
            if (!range.text.trim()) {
                console.log('No text selected to convert to numbered list');
                return false;
            }

            // Split into lines
            const lines = range.text.split('\n').filter(line => line.trim());

            // Clear the selection
            range.clear();

            // Create numbered list
            const startNumber = options.startNumber || 1;
            let currentNumber = startNumber;

            for (const line of lines) {
                const paragraph = range.insertParagraph(line, Word.InsertLocation.before);
                paragraph.setNumbering(Word.NumberingType.arabic, currentNumber);
                currentNumber++;
            }

            await context.sync();
            return true;
        });
    }

    /**
     * Convert text data to table
     * @param {Object} options - Table options
     * @returns {Promise<boolean>} Success status
     */
    async convertToTable(options = { delimiter: '\t', hasHeader: true }) {
        return Word.run(async context => {
            // Get current selection
            const range = context.document.getSelection();
            range.load('text');

            await context.sync();

            // Check if there's any text selected
            if (!range.text.trim()) {
                console.log('No text selected to convert to table');
                return false;
            }

            // Split into rows
            const rows = range.text.split('\n').filter(row => row.trim());

            if (rows.length < 2) {
                console.log('Not enough rows to create a table');
                return false;
            }

            // Determine number of columns based on the delimiter
            const delimiter = options.delimiter || '\t';
            const columnCount = rows[0].split(delimiter).length;

            // Create a table
            const table = range.insertTable(rows.length, columnCount,
                Word.InsertLocation.replace, []);

            // Fill the table with data
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].split(delimiter);

                for (let j = 0; j < Math.min(cells.length, columnCount); j++) {
                    table.getCell(i, j).body.insertText(cells[j].trim(), Word.InsertLocation.replace);
                }
            }

            // Apply header formatting if specified
            if (options.hasHeader) {
                const headerRow = table.getRow(0);
                headerRow.font.bold = true;
            }

            await context.sync();
            return true;
        });
    }

    /**
     * Reorganize content by topic
     * @param {Object} options - Reorganization options
     * @returns {Promise<boolean>} Success status
     */
    async reorganizeByTopic(options = { method: 'heading' }) {
        try {
            // Determine which detection method to use
            const method = options.method || 'heading';
            if (!this.topicDetectionMethods[method]) {
                throw new Error(`Topic detection method '${method}' not found`);
            }

            // Detect topics in the document
            const topics = await this.topicDetectionMethods[method](options);

            if (!topics || topics.length === 0) {
                console.log('No topics detected for reorganization');
                return false;
            }

            // Reorganize content based on topics
            return await this.applyTopicReorganization(topics, options);
        } catch (error) {
            console.error('Error reorganizing content by topic:', error);
            throw error;
        }
    }

    /**
     * Detect topics by headings
     * @param {Object} options - Detection options
     * @returns {Promise<Array>} Detected topics
     */
    async detectTopicsByHeadings(options = {}) {
        return Word.run(async context => {
            // Get all headings in the document
            const headings = [];

            for (let i = 1; i <= 3; i++) {
                // Get headings level 1-3
                const levelHeadings = context.document.body.paragraphs
                    .getByStyleNameOrId(`Heading ${i}`);
                levelHeadings.load('text');

                await context.sync();

                headings.push(...levelHeadings.items.map(h => ({
                    text: h.text,
                    level: i,
                    range: h.getRange()
                })));
            }

            await context.sync();
            return headings;
        });
    }

    /**
     * Detect topics by keywords
     * @param {Object} options - Detection options
     * @returns {Promise<Array>} Detected topics
     */
    async detectTopicsByKeywords(options = {}) {
        // This would use a more sophisticated keyword extraction algorithm
        // Simplified implementation for demonstration
        return Word.run(async context => {
            const body = context.document.body;
            body.load('text');

            await context.sync();

            const text = body.text;

            // Simple keyword extraction (would be more sophisticated in real implementation)
            const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
            const wordFreq = {};

            words.forEach(word => {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            });

            const keywords = Object.entries(wordFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([word]) => word);

            return keywords.map(keyword => ({
                text: keyword,
                type: 'keyword'
            }));
        });
    }

    /**
     * Detect topics semantically
     * @param {Object} options - Detection options
     * @returns {Promise<Array>} Detected topics
     */
    async detectTopicsSemantically(options = {}) {
        // This would use an AI-based semantic analysis
        // Placeholder implementation
        console.log('Semantic topic detection would use AI API');
        return [];
    }

    /**
     * Apply topic reorganization to the document
     * @param {Array} topics - Detected topics
     * @param {Object} options - Reorganization options
     * @returns {Promise<boolean>} Success status
     */
    async applyTopicReorganization(topics, options = {}) {
        // This would reorganize the document based on detected topics
        // Complex implementation would be required in a real system
        console.log('Topic reorganization would be applied here');
        return true;
    }
}

// Create global instance
const contentArranger = new ContentArranger();
