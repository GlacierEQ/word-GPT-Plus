/**
 * Word Document Service
 * 
 * Provides an interface for interacting with the Word document
 */

/**
 * Get the selected text from the document
 * @returns {Promise<string>} The selected text
 */
export async function getSelectedText() {
    return new Promise((resolve, reject) => {
        try {
            Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    resolve(result.value);
                } else {
                    reject(new Error(result.error.message));
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get the document text around the current selection (surrounding context)
 * @param {number} paragraphsBefore - Number of paragraphs to get before selection
 * @param {number} paragraphsAfter - Number of paragraphs to get after selection
 * @returns {Promise<string>} The context text
 */
export async function getContextAroundSelection(paragraphsBefore = 2, paragraphsAfter = 2) {
    return Word.run(async (context) => {
        // Get the current selection
        const selection = context.document.getSelection();

        // Get paragraphs before selection
        let startPosition = selection.paragraphs.getFirst().getRange('Start').getStartPoint();
        const paragraphsBeforeRange = startPosition.getRange('Before').getParagraphsAfter(paragraphsBefore * -1);

        // Get paragraphs after selection
        let endPosition = selection.paragraphs.getLast().getRange('End').getEndPoint();
        const paragraphsAfterRange = endPosition.getRange('After').getParagraphsAfter(paragraphsAfter);

        // Load properties
        selection.load('text');
        paragraphsBeforeRange.load('text');
        paragraphsAfterRange.load('text');

        await context.sync();

        // Combine the text
        const contextText = {
            before: paragraphsBeforeRange.text,
            selection: selection.text,
            after: paragraphsAfterRange.text
        };

        return contextText;
    }).catch(error => {
        console.error('Error getting context around selection:', error);
        // Return empty context if there was an error
        return { before: '', selection: '', after: '' };
    });
}

/**
 * Insert text at the current selection
 * @param {string} text - The text to insert
 * @param {boolean} replaceSelection - Whether to replace the selection or insert at cursor
 * @returns {Promise<boolean>} Success status
 */
export async function insertText(text, replaceSelection = true) {
    return new Promise((resolve, reject) => {
        try {
            Office.context.document.setSelectedDataAsync(
                text,
                { coercionType: Office.CoercionType.Text },
                (result) => {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        resolve(true);
                    } else {
                        reject(new Error(result.error.message));
                    }
                }
            );
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Insert HTML at the current selection
 * @param {string} html - The HTML to insert
 * @param {boolean} replaceSelection - Whether to replace the selection or insert at cursor
 * @returns {Promise<boolean>} Success status
 */
export async function insertHtml(html, replaceSelection = true) {
    return new Promise((resolve, reject) => {
        try {
            Office.context.document.setSelectedDataAsync(
                html,
                { coercionType: Office.CoercionType.Html },
                (result) => {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        resolve(true);
                    } else {
                        reject(new Error(result.error.message));
                    }
                }
            );
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Insert an image at the current selection
 * @param {string} base64Image - The base64-encoded image data
 * @param {string} altText - Alt text for the image
 * @returns {Promise<boolean>} Success status
 */
export async function insertImage(base64Image, altText = 'Image') {
    return Word.run(async (context) => {
        // Get the current selection as the insertion point
        const range = context.document.getSelection();

        // Remove "data:image/jpeg;base64," if present
        const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

        // Insert the image
        const image = range.insertInlinePictureFromBase64(base64Data);

        // Set alt text
        image.altTextTitle = altText;

        await context.sync();
        return true;
    }).catch(error => {
        console.error('Error inserting image:', error);
        return false;
    });
}

/**
 * Get document metadata
 * @returns {Promise<Object>} Document metadata
 */
export async function getDocumentMetadata() {
    return Word.run(async (context) => {
        // Get document properties
        const properties = context.document.properties;
        properties.load('title,author,subject,keywords,createdDateTime,lastModifiedDateTime');

        // Get document statistics
        const contentControls = context.document.contentControls;
        contentControls.load('items');

        const body = context.document.body;
        body.load('text,style,wordCount');

        await context.sync();

        return {
            title: properties.title,
            author: properties.author,
            subject: properties.subject,
            keywords: properties.keywords,
            created: properties.createdDateTime,
            modified: properties.lastModifiedDateTime,
            wordCount: body.wordCount,
            controlsCount: contentControls.items.length
        };
    }).catch(error => {
        console.error('Error getting document metadata:', error);
        return {
            title: 'Unknown',
            author: 'Unknown',
            wordCount: 0
        };
    });
}

/**
 * Check if the document is in read-only mode
 * @returns {Promise<boolean>} Whether the document is read-only
 */
export async function isDocumentReadOnly() {
    return new Promise((resolve) => {
        try {
            Office.context.document.getActiveViewAsync((result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    resolve(result.value.readOnly === true);
                } else {
                    resolve(false); // Default to false if we can't determine
                }
            });
        } catch (error) {
            console.error('Error checking read-only status:', error);
            resolve(false); // Default to false on error
        }
    });
}

/**
 * Create a custom hook for Word document operations
 * @returns {Object} Word document operations
 */
export function useWordDocument() {
    const [selectedText, setSelectedText] = useState('');
    const [documentContext, setDocumentContext] = useState({ before: '', selection: '', after: '' });
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [metadata, setMetadata] = useState({});

    // Get selected text
    const refreshSelectedText = useCallback(async () => {
        try {
            const text = await getSelectedText();
            setSelectedText(text);
            return text;
        } catch (error) {
            console.error('Error getting selected text:', error);
            return '';
        }
    }, []);

    // Get context around selection
    const refreshContext = useCallback(async (paragraphsBefore = 2, paragraphsAfter = 2) => {
        try {
            const context = await getContextAroundSelection(paragraphsBefore, paragraphsAfter);
            setDocumentContext(context);
            return context;
        } catch (error) {
            console.error('Error getting context:', error);
            return { before: '', selection: '', after: '' };
        }
    }, []);

    // Insert text
    const insertTextAtCursor = useCallback(async (text, replace = true) => {
        try {
            return await insertText(text, replace);
        } catch (error) {
            console.error('Error inserting text:', error);
            return false;
        }
    }, []);

    // Insert HTML
    const insertHtmlAtCursor = useCallback(async (html, replace = true) => {
        try {
            return await insertHtml(html, replace);
        } catch (error) {
            console.error('Error inserting HTML:', error);
            return false;
        }
    }, []);

    // Insert image
    const insertImageAtCursor = useCallback(async (base64Image, altText = 'Image') => {
        try {
            return await insertImage(base64Image, altText);
        } catch (error) {
            console.error('Error inserting image:', error);
            return false;
        }
    }, []);

    // Check document status
    const checkDocumentStatus = useCallback(async () => {
        try {
            const readOnly = await isDocumentReadOnly();
            setIsReadOnly(readOnly);

            const meta = await getDocumentMetadata();
            setMetadata(meta);

            return { readOnly, metadata: meta };
        } catch (error) {
            console.error('Error checking document status:', error);
            return { readOnly: false, metadata: {} };
        }
    }, []);

    // Initialize
    useEffect(() => {
        refreshSelectedText();
        refreshContext();
        checkDocumentStatus();

        // Set up event handlers for selection changes
        const handleSelectionChanged = () => {
            refreshSelectedText();
            refreshContext();
        };

        // Add event listener if available
        if (Office.context.document.addHandlerAsync) {
            Office.context.document.addHandlerAsync(
                Office.EventType.DocumentSelectionChanged,
                handleSelectionChanged
            );
        }

        // Clean up
        return () => {
            if (Office.context.document.removeHandlerAsync) {
                Office.context.document.removeHandlerAsync(
                    Office.EventType.DocumentSelectionChanged,
                    { handler: handleSelectionChanged }
                );
            }
        };
    }, [refreshSelectedText, refreshContext, checkDocumentStatus]);

    return {
        selectedText,
        documentContext,
        isReadOnly,
        metadata,
        getSelectedText: refreshSelectedText,
        getContext: refreshContext,
        insertText: insertTextAtCursor,
        insertHtml: insertHtmlAtCursor,
        insertImage: insertImageAtCursor,
        refreshDocumentStatus: checkDocumentStatus
    };
}
