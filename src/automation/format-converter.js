/**
 * Word GPT Plus - Format Converter
 * Handles document formatting operations and conversions
 */

class FormatConverter {
    constructor() {
        // Table styles
        this.tableStyles = {
            simple: {
                headerStyle: {
                    bold: true,
                    color: '#000000',
                    shading: { color: '#EEEEEE' }
                },
                bodyStyle: {
                    borderColor: '#CCCCCC',
                    borderWidth: 1
                },
                alternateRowStyle: false
            },
            striped: {
                headerStyle: {
                    bold: true,
                    color: '#FFFFFF',
                    shading: { color: '#4472C4' }
                },
                bodyStyle: {
                    borderColor: '#CCCCCC',
                    borderWidth: 1
                },
                alternateRowStyle: {
                    shading: { color: '#F2F2F2' }
                }
            },
            professional: {
                headerStyle: {
                    bold: true,
                    color: '#FFFFFF',
                    shading: { color: '#2F5597' }
                },
                bodyStyle: {
                    borderColor: '#D0D0D0',
                    borderWidth: 1
                },
                alternateRowStyle: {
                    shading: { color: '#EDF5FF' }
                }
            }
        };

        // Smart characters mappings
        this.smartChars = {
            quotes: {
                '"': { open: '"', close: '"' },
                "'": { open: ''', close: ''' }
            },
            dashes: {
                '--': '–',  // en dash
                '---': '—'  // em dash
            },
            symbols: {
                '(c)': '©',
                '(r)': '®',
                '(tm)': '™',
                '...': '…'
            }
        };
    }

    /**
     * Format a table in the document
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Formatting result
     */
    async formatTable(context, params = {}) {
        try {
            const { style = 'professional' } = params;
            const tableStyle = this.tableStyles[style] || this.tableStyles.professional;

            // Get current selection
            const selection = context.document.getSelection();

            // Get tables in selection
            const tables = selection.tables;
            tables.load('items');
            await context.sync();

            if (tables.items.length === 0) {
                throw new Error('No table found in selection');
            }

            // Process the first table in the selection
            const table = tables.items[0];

            // Load table properties
            table.load('rowCount,columnCount');
            await context.sync();

            // Format table headers
            if (table.rowCount > 0) {
                const headerRow = table.rows.getFirst();
                headerRow.load('cells');
                await context.sync();

                // Apply header formatting
                headerRow.cells.items.forEach(cell => {
                    cell.load('body');

                    if (tableStyle.headerStyle.bold) {
                        cell.body.font.bold = true;
                    }

                    if (tableStyle.headerStyle.color) {
                        cell.body.font.color = tableStyle.headerStyle.color;
                    }

                    if (tableStyle.headerStyle.shading) {
                        cell.shading.color = tableStyle.headerStyle.shading.color;
                    }
                });
            }

            // Format all cells with borders
            if (tableStyle.bodyStyle) {
                table.getBorder('All').color = tableStyle.bodyStyle.borderColor;
                table.getBorder('All').width = tableStyle.bodyStyle.borderWidth;
            }

            // Apply alternating row style if specified
            if (tableStyle.alternateRowStyle && table.rowCount > 1) {
                for (let i = 1; i < table.rowCount; i += 2) {
                    const row = table.rows.getItem(i);
                    row.load('cells');
                    await context.sync();

                    row.cells.items.forEach(cell => {
                        if (tableStyle.alternateRowStyle.shading) {
                            cell.shading.color = tableStyle.alternateRowStyle.shading.color;
                        }
                    });
                }
            }

            // Apply AutoFit to table
            table.autoFit();

            await context.sync();

            return {
                tableStyleApplied: style,
                rowCount: table.rowCount,
                columnCount: table.columnCount,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error formatting table:', error);
            throw error;
        }
    }

    /**
     * Convert straight quotes to smart quotes throughout document or selection
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Conversion result
     */
    async smartifyQuotes(context, params = {}) {
        try {
            const { target = 'selection' } = params;
            let range;

            // Determine text range to process
            if (target === 'document') {
                range = context.document.body;
            } else {
                range = context.document.getSelection();
            }

            range.load('text');
            await context.sync();

            if (!range.text || range.text.length === 0) {
                throw new Error(`No text found in ${target}`);
            }

            // Calculate statistics for reporting
            const originalText = range.text;
            const stats = {
                straightQuotes: (originalText.match(/"/g) || []).length,
                apostrophes: (originalText.match(/'/g) || []).length,
                doubleDashes: (originalText.match(/--/g) || []).length,
                tripleDashes: (originalText.match(/---/g) || []).length,
                ellipses: (originalText.match(/\.\.\./g) || []).length,
                copyright: (originalText.match(/\(c\)/gi) || []).length,
                trademark: (originalText.match(/\(tm\)/gi) || []).length,
                registered: (originalText.match(/\(r\)/gi) || []).length
            };

            // Process using Word's built-in search and replace
            const replacements = [
                // Smart quotes - This is simplified; in a real implementation, 
                // you'd need context-aware replacement to differentiate opening/closing quotes
                { search: '"', replace: '"' },
                { search: "'", replace: "'" },

                // Dashes
                { search: '---', replace: '—' }, // em dash
                { search: '--', replace: '–' },  // en dash

                // Symbols
                { search: '(c)', replace: '©' },
                { search: '(C)', replace: '©' },
                { search: '(r)', replace: '®' },
                { search: '(R)', replace: '®' },
                { search: '(tm)', replace: '™' },
                { search: '(TM)', replace: '™' },
                { search: '...', replace: '…' } // ellipsis
            ];

            // Execute replacements
            for (const item of replacements) {
                const searchResults = range.search(item.search, { matchCase: false, matchWholeWord: false });
                searchResults.load('items');
                await context.sync();

                for (let i = 0; i < searchResults.items.length; i++) {
                    searchResults.items[i].insertText(item.replace, 'Replace');
                }

                await context.sync();
            }

            // Get updated text
            range.load('text');
            await context.sync();
            const newText = range.text;

            return {
                originalLength: originalText.length,
                newLength: newText.length,
                replacements: stats,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error converting to smart quotes:', error);
            throw error;
        }
    }

    /**
     * Convert text case (UPPERCASE, lowercase, Title Case, etc.)
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Conversion result
     */
    async convertCase(context, params = {}) {
        try {
            const { caseType = 'title' } = params;

            // Get current selection
            const selection = context.document.getSelection();
            selection.load('text');
            await context.sync();

            if (!selection.text) {
                throw new Error('No text selected');
            }

            let newText;
            const originalText = selection.text;

            // Apply the case transformation
            switch (caseType) {
                case 'upper':
                    newText = originalText.toUpperCase();
                    break;
                case 'lower':
                    newText = originalText.toLowerCase();
                    break;
                case 'title':
                    newText = this._toTitleCase(originalText);
                    break;
                case 'sentence':
                    newText = this._toSentenceCase(originalText);
                    break;
                case 'toggle':
                    newText = this._toggleCase(originalText);
                    break;
                default:
                    newText = originalText;
            }

            // Insert the transformed text
            selection.insertText(newText, 'Replace');
            await context.sync();

            return {
                caseType,
                charactersChanged: originalText.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error converting case:', error);
            throw error;
        }
    }

    /**
     * Convert text to Title Case
     * @private
     */
    _toTitleCase(text) {
        // Words that should remain lowercase in titles (unless they're the first or last word)
        const minorWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor',
            'on', 'at', 'to', 'from', 'by', 'with', 'in', 'of', 'as']);

        // Split into sentences
        return text.split(/(?<=[.!?])\s+/).map(sentence => {
            // Process each sentence
            const words = sentence.split(/\s+/);
            if (words.length === 0) return '';

            return words.map((word, index) => {
                // Always capitalize first and last word
                if (index === 0 || index === words.length - 1) {
                    return this._capitalizeFirstLetter(word);
                }

                // Check if it's a minor word
                const lowerWord = word.toLowerCase();
                if (minorWords.has(lowerWord)) {
                    return lowerWord;
                }

                return this._capitalizeFirstLetter(word);
            }).join(' ');
        }).join(' ');
    }

    /**
     * Convert text to Sentence case
     * @private
     */
    _toSentenceCase(text) {
        // Split into sentences
        return text.split(/(?<=[.!?])\s+/).map(sentence => {
            if (!sentence) return '';
            return sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase();
        }).join(' ');
    }

    /**
     * Toggle case of text
     * @private
     */
    _toggleCase(text) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === char.toUpperCase()) {
                result += char.toLowerCase();
            } else {
                result += char.toUpperCase();
            }
        }
        return result;
    }

    /**
     * Capitalize first letter of a word
     * @private
     */
    _capitalizeFirstLetter(word) {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
}

// Create and export singleton instance
const formatConverter = new FormatConverter();
export default formatConverter;
