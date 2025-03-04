import { useState, useEffect, useCallback } from 'react';
import { startTiming, endTiming } from '../utils/performance';
import { resourceTracker } from '../utils/performance';

/**
 * Custom hook for Word document interactions
 * @returns {Object} Word document utilities
 */
export function useWordDocument() {
    const [selectedText, setSelectedText] = useState('');
    const [documentContext, setDocumentContext] = useState('');
    const [isInserting, setIsInserting] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Get the current selected text from Word
     * @returns {Promise<string>} Selected text
     */
    const getSelectedText = useCallback(async () => {
        try {
            setError(null);
            startTiming('getSelectedText');

            // Check if Office and Word objects exist
            if (!window.Office || !window.Word) {
                throw new Error('Office JS API not available');
            }

            return await Word.run(async context => {
                const selection = context.document.getSelection();
                selection.load('text');
                await context.sync();

                const text = selection.text;
                setSelectedText(text);
                endTiming('getSelectedText');
                return text;
            });
        } catch (err) {
            endTiming('getSelectedText', { error: true });
            console.error('Error getting selected text:', err);
            setError({
                message: `Couldn't get selected text: ${err.message}`,
                type: 'selection'
            });
            return '';
        }
    }, []);

    /**
     * Get surrounding context from the document
     * @param {number} paragraphsBefore - Number of paragraphs to get before selection
     * @param {number} paragraphsAfter - Number of paragraphs to get after selection
     * @returns {Promise<string>} Document context
     */
    const getDocumentContext = useCallback(async (paragraphsBefore = 2, paragraphsAfter = 2) => {
        try {
            setError(null);
            startTiming('getDocumentContext');

            // Check if Office and Word objects exist
            if (!window.Office || !window.Word) {
                throw new Error('Office JS API not available');
            }

            return await Word.run(async context => {
                const selection = context.document.getSelection();
                selection.load('paragraphs');
                await context.sync();

                // Get the paragraphs containing the selection
                if (selection.paragraphs.items.length === 0) {
                    return '';
                }

                // Get current paragraph
                const currentParagraph = selection.paragraphs.items[0];
                currentParagraph.load('text');

                // Get paragraphs before
                let beforeText = '';
                let para = currentParagraph;
                for (let i = 0; i < paragraphsBefore; i++) {
                    try {
                        const prevPara = para.getPrevious();
                        prevPara.load('text');
                        await context.sync();
                        beforeText = prevPara.text + '\n' + beforeText;
                        para = prevPara;
                    } catch (err) {
                        // No more paragraphs before
                        break;
                    }
                }

                // Get paragraphs after
                let afterText = '';
                para = currentParagraph;
                for (let i = 0; i < paragraphsAfter; i++) {
                    try {
                        const nextPara = para.getNext();
                        nextPara.load('text');
                        await context.sync();
                        afterText = afterText + '\n' + nextPara.text;
                        para = nextPara;
                    } catch (err) {
                        // No more paragraphs after
                        break;
                    }
                }

                // Combine context
                await context.sync();
                const fullContext = beforeText + '\n' + currentParagraph.text + '\n' + afterText;
                setDocumentContext(fullContext.trim());
                endTiming('getDocumentContext');

                return fullContext;
            });
        } catch (err) {
            endTiming('getDocumentContext', { error: true });
            console.error('Error getting document context:', err);
            setError({
                message: `Couldn't get document context: ${err.message}`,
                type: 'context'
            });
            return '';
        }
    }, []);

    /**
     * Insert text into the document
     * @param {string} text - Text to insert
     * @param {Object} options - Insert options
     * @returns {Promise<boolean>} Success status
     */
    const insertText = useCallback(async (text, options = {}) => {
        const {
            location = 'replace',  // replace, before, after
            formatting = null      // bold, italic, etc.
        } = options;

        try {
            setIsInserting(true);
            setError(null);
            startTiming('insertText');

            if (!text) {
                throw new Error('No text to insert');
            }

            // Check if Office and Word objects exist
            if (!window.Office || !window.Word) {
                throw new Error('Office JS API not available');
            }

            await Word.run(async context => {
                let targetRange;

                // Determine where to insert
                if (location === 'replace') {
                    targetRange = context.document.getSelection();
                } else if (location === 'after') {
                    targetRange = context.document.getSelection().getEndPoint();
                } else if (location === 'before') {
                    targetRange = context.document.getSelection().getStartPoint();
                }

                // Insert the text
                const insertLocation = location === 'replace'
                    ? Word.InsertLocation.replace
                    : location === 'before'
                        ? Word.InsertLocation.before
                        : Word.InsertLocation.after;

                const insertedRange = targetRange.insertText(text, insertLocation);

                // Apply formatting if specified
                if (formatting) {
                    if (formatting.bold) insertedRange.font.bold = true;
                    if (formatting.italic) insertedRange.font.italic = true;
                    if (formatting.underline) insertedRange.font.underline = 'single';
                    if (formatting.color) insertedRange.font.color = formatting.color;
                    if (formatting.size) insertedRange.font.size = formatting.size;
                    if (formatting.font) insertedRange.font.name = formatting.font;
                }

                await context.sync();
            });

            endTiming('insertText');
            return true;
        } catch (err) {
            endTiming('insertText', { error: true });
            console.error('Error inserting text:', err);
            setError({
                message: `Couldn't insert text: ${err.message}`,
                type: 'insertion'
            });
            return false;
        } finally {
            setIsInserting(false);
        }
    }, []);

    /**
     * Insert an image into the document
     * @param {string} base64Image - Base64-encoded image data
     * @param {Object} options - Insert options
     * @returns {Promise<boolean>} Success status
     */
    const insertImage = useCallback(async (base64Image, options = {}) => {
        const {
            width = 400,
            height = 'auto',
            altText = 'Inserted image',
            location = 'current'  // current, start, end
        } = options;

        try {
            setIsInserting(true);
            setError(null);
            startTiming('insertImage');

            // Check if Office and Word objects exist
            if (!window.Office || !window.Word) {
                throw new Error('Office JS API not available');
            }

            await Word.run(async context => {
                let targetRange;

                // Determine where to insert the image
                if (location === 'current') {
                    targetRange = context.document.getSelection();
                } else if (location === 'start') {
                    targetRange = context.document.body.getRange('Start');
                } else if (location === 'end') {
                    targetRange = context.document.body.getRange('End');
                }

                // Convert base64 to proper format if needed
                let imageData = base64Image;
                if (imageData.startsWith('data:image')) {
                    imageData = imageData.split(',')[1];
                }

                // Insert the image
                const insertedImage = targetRange.insertInlinePictureFromBase64(imageData, Word.InsertLocation.after);

                // Set image properties
                if (width !== 'auto') {
                    insertedImage.width = width;
                }

                if (height !== 'auto') {
                    insertedImage.height = height;
                }

                if (altText) {
                    insertedImage.altTextTitle = altText;
                }

                await context.sync();
            });

            endTiming('insertImage');
            return true;
        } catch (err) {
            endTiming('insertImage', { error: true });
            console.error('Error inserting image:', err);
            setError({
                message: `Couldn't insert image: ${err.message}`,
                type: 'image-insertion'
            });
            return false;
        } finally {
            setIsInserting(false);
        }
    }, []);

    /**
     * Insert a table into the document
     * @param {Array<Array<string>>} data - Table data as 2D array
     * @param {Object} options - Table options
     * @returns {Promise<boolean>} Success status
     */
    const insertTable = useCallback(async (data, options = {}) => {
        const {
            headers = true,  // First row is headers
            style = 'TableGrid',  // Table style
            location = 'current'  // current, start, end
        } = options;

        try {
            if (!data || !data.length || !data[0].length) {
                throw new Error('Invalid table data');
            }

            setIsInserting(true);
            setError(null);
            startTiming('insertTable');

            // Check if Office and Word objects exist
            if (!window.Office || !window.Word) {
                throw new Error('Office JS API not available');
            }

            await Word.run(async context => {
                let targetRange;

                // Determine insertion location
                if (location === 'current') {
                    targetRange = context.document.getSelection();
                } else if (location === 'start') {
                    targetRange = context.document.body.getRange('Start');
                } else if (location === 'end') {
                    targetRange = context.document.body.getRange('End');
                }

                const rows = data.length;
                const cols = data[0].length;

                // Create the table
                const table = targetRange.insertTable(rows, cols, Word.InsertLocation.after, data);

                // Apply table style
                if (style) {
                    table.style = style;
                }

                // Format header row if needed
                if (headers && rows > 1) {
                    const headerRow = table.getRange().getRow(0);
                    headerRow.font.bold = true;
                }

                await context.sync();
            });

            endTiming('insertTable');
            return true;
        } catch (err) {
            endTiming('insertTable', { error: true });
            console.error('Error inserting table:', err);
            setError({
                message: `Couldn't insert table: ${err.message}`,
                type: 'table-insertion'
            });
            return false;
        } finally {
            setIsInserting(false);
        }
    }, []);

    /**
     * Get document properties like title and author
     * @returns {Promise<Object>} Document properties
     */
    const getDocumentProperties = useCallback(async () => {
        try {
            setError(null);

            // Check if Office and Word objects exist
            if (!window.Office || !window.Word) {
                throw new Error('Office JS API not available');
            }

            return await Word.run(async context => {
                const properties = context.document.properties;
                properties.load('title,author,subject,keywords,lastAuthor');
                await context.sync();

                return {
                    title: properties.title,
                    author: properties.author,
                    subject: properties.subject,
                    keywords: properties.keywords,
                    lastAuthor: properties.lastAuthor
                };
            });
        } catch (err) {
            console.error('Error getting document properties:', err);
            setError({
                message: `Couldn't get document properties: ${err.message}`,
                type: 'properties'
            });
            return null;
        }
    }, []);

    // Initialize by getting selected text when component mounts
    useEffect(() => {
        getSelectedText().catch(err => {
            console.error('Error during initial text selection:', err);
        });

        // Clean up resources when unmounting
        return () => {
            resourceTracker.revokeAll();
        };
    }, [getSelectedText]);

    return {
        selectedText,
        documentContext,
        isInserting,
        error,
        getSelectedText,
        getDocumentContext,
        insertText,
        insertImage,
        insertTable,
        getDocumentProperties
    };
}
