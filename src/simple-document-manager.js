/**
 * Word GPT Plus - Simple Document Manager
 * Handles document interactions like getting selected text and inserting content
 */

class SimpleDocumentManager {
    constructor() {
        // Track document state
        this.documentContext = null;
        this.currentSelection = {
            text: '',
            range: null
        };
        this.documentStats = {
            wordCount: 0,
            paragraphCount: 0,
            characterCount: 0
        };
    }

    /**
     * Get currently selected text from Word document
     * @returns {Promise<string>} Selected text
     */
    async getSelectedText() {
        return new Promise((resolve, reject) => {
            try {
                Word.run(async (context) => {
                    const selection = context.document.getSelection();
                    selection.load('text');
                    await context.sync();

                    // Save current selection
                    this.currentSelection.text = selection.text;
                    this.currentSelection.range = selection;
                    this.documentContext = context;

                    resolve(selection.text);
                });
            } catch (error) {
                console.error('Error getting selected text:', error);
                reject(error);
            }
        });
    }

    /**
     * Insert text into the document
     * @param {string} text - Text to insert
     * @returns {Promise<boolean>} Success indicator
     */
    async insertText(text) {
        return new Promise((resolve, reject) => {
            try {
                Word.run(async (context) => {
                    // If we have a saved selection, replace it
                    if (this.currentSelection.range) {
                        // Re-get the range if context is different
                        const range = context === this.documentContext
                            ? this.currentSelection.range
                            : context.document.getSelection();

                        range.insertText(text, Word.InsertLocation.replace);
                    } else {
                        // Otherwise insert at current selection
                        const selection = context.document.getSelection();
                        selection.insertText(text, Word.InsertLocation.replace);
                    }

                    await context.sync();
                    resolve(true);
                });
            } catch (error) {
                console.error('Error inserting text:', error);
                reject(error);
            }
        });
    }

    /**
     * Get document statistics
     * @returns {Promise<Object>} Document statistics
     */
    async getDocumentStats() {
        return new Promise((resolve, reject) => {
            try {
                Word.run(async (context) => {
                    const body = context.document.body;
                    body.load(['text', 'paragraphs']);
                    await context.sync();

                    // Calculate statistics
                    const text = body.text;
                    const wordCount = text.trim().split(/\s+/).length;
                    const paragraphCount = body.paragraphs.items.length;
                    const characterCount = text.length;

                    // Save and return stats
                    this.documentStats = {
                        wordCount,
                        paragraphCount,
                        characterCount
                    };

                    resolve(this.documentStats);
                });
            } catch (error) {
                console.error('Error getting document stats:', error);
                reject(error);
            }
        });
    }
}

// Create and export singleton instance
const simpleDocumentManager = new SimpleDocumentManager();
export default simpleDocumentManager;
