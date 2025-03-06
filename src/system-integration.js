/**
 * Word GPT Plus - System Integration
 * Top-level component that coordinates all system modules
 */

class SystemIntegration {
    constructor() {
        // Component references
        this.components = {
            qualityStandards: null,
            modelManager: null,
            documentManager: null,
            recursiveOptimizer: null,
            multiverseWriting: null,
            workflowManager: null,
            securityProtocol: null,
            apiClient: null
        };

        // Integration status
        this.status = {
            initialized: false,
            activeMode: 'standard', // 'standard', 'multiverse', 'optimization'
            currentWorkflow: null,
            ready: false
        };

        // Event listeners
        this.events = {};

        // UI references
        this.ui = {
            mainContainer: null,
            activePanel: null,
            statusBar: null
        };
    }

    /**
     * Initialize the system integration
     * @returns {Promise<void>}
     */
    async initialize() {
        console.log('Initializing system integration...');

        try {
            // Load component references
            this.loadComponentReferences();

            // Set up cross-component connections
            this.setupComponentConnections();

            // Initialize UI
            this.initializeUI();

            // Set initialized flag
            this.status.initialized = true;
            this.status.ready = true;

            console.log('System integration initialized successfully');

            // Dispatch initialization event
            this.dispatchEvent('system:initialized', {
                status: 'success',
                components: Object.keys(this.components).filter(key => this.components[key] !== null)
            });
        } catch (error) {
            console.error('System integration initialization failed:', error);

            // Dispatch error event
            this.dispatchEvent('system:initialization-failed', {
                error: error.message,
                stack: error.stack
            });

            throw error;
        }
    }

    /**
     * Load component references
     */
    loadComponentReferences() {
        // Try to load each component from global scope
        Object.keys(this.components).forEach(key => {
            const globalRef = window[key];
            if (globalRef) {
                this.components[key] = globalRef;
                console.log(`Component loaded: ${key}`);
            } else {
                console.warn(`Component not found: ${key}`);
            }
        });

        // Verify essential components
        const essentialComponents = ['qualityStandards', 'modelManager'];
        const missingEssentials = essentialComponents.filter(key => !this.components[key]);

        if (missingEssentials.length > 0) {
            throw new Error(`Missing essential components: ${missingEssentials.join(', ')}`);
        }
    }

    /**
     * Set up connections and integrations between components
     */
    setupComponentConnections() {
        // Connect quality standards to model manager
        if (this.components.qualityStandards && this.components.modelManager) {
            this.components.modelManager.setQualityMonitor(this.components.qualityStandards);
        }

        // Connect recursive optimizer to quality standards for metrics
        if (this.components.recursiveOptimizer && this.components.qualityStandards) {
            this.components.recursiveOptimizer.setQualityStandards(this.components.qualityStandards);
        }

        // Connect workflow manager to model manager
        if (this.components.workflowManager && this.components.modelManager) {
            this.setupWorkflowHandlers();
        }

        // Connect security protocol to API client
        if (this.components.securityProtocol && this.components.apiClient) {
            this.components.apiClient.setSecurityProtocol(this.components.securityProtocol);
        }
    }

    /**
     * Set up workflow handlers
     */
    setupWorkflowHandlers() {
        // Register common workflow handlers
        const workflowManager = this.components.workflowManager;
        const modelManager = this.components.modelManager;

        // Document analysis handler
        workflowManager.registerHandler('analyzeDocument', async (inputs) => {
            const { documentText } = inputs;

            // Analyze document structure
            const structure = await this.analyzeDocumentStructure(documentText);

            // Analyze content quality
            const contentQuality = await this.analyzeContentQuality(documentText);

            // Identify improvement areas
            const improvementAreas = this.identifyImprovementAreas(contentQuality);

            return {
                documentStructure: structure,
                contentQuality,
                improvementAreas
            };
        });

        // Content optimization handler
        workflowManager.registerHandler('optimizeContent', async (inputs) => {
            const { documentText, improvementAreas } = inputs;

            // Skip if no improvement areas identified
            if (!improvementAreas || improvementAreas.length === 0) {
                return { optimizedContent: documentText };
            }

            // Use the recursive optimizer if available
            if (this.components.recursiveOptimizer) {
                const optimizedContent = await this.components.recursiveOptimizer.optimize(
                    documentText,
                    {
                        goal: `improve ${improvementAreas.join(', ')}`,
                        depth: 2
                    }
                );

                return { optimizedContent };
            }

            // Fallback to direct model call
            const promptTemplate = `Please improve the following text focusing on ${improvementAreas.join(', ')}:\n\n${documentText}`;
            const optimizedContent = await modelManager.generateText(promptTemplate);

            return { optimizedContent };
        });

        // Format enhancement handler
        workflowManager.registerHandler('enhanceFormat', async (inputs) => {
            const { optimizedContent, documentStructure } = inputs;

            // For now, just return the optimized content
            // In a production system, this would enhance formatting based on the document structure
            return { formattedContent: optimizedContent };
        });
    }

    /**
     * Initialize the UI
     */
    initializeUI() {
        // This would be implemented in a production system
        console.log('UI initialization placeholder');
    }

    /**
     * Analyze document structure
     * @param {string} documentText - Document text
     * @returns {Promise<Object>} Document structure
     */
    async analyzeDocumentStructure(documentText) {
        try {
            // Use document manager if available
            if (this.components.documentManager) {
                return this.components.documentManager.analyzeStructure(documentText);
            }

            // Fallback to basic analysis
            const paragraphs = documentText.split(/\n\s*\n/);
            const wordCount = documentText.split(/\s+/).length;

            return {
                paragraphs: paragraphs.length,
                wordCount,
                estimatedReadTime: Math.ceil(wordCount / 200) // 200 words per minute
            };
        } catch (error) {
            console.error('Error analyzing document structure:', error);
            return {
                error: error.message
            };
        }
    }

    /**
     * Analyze content quality
     * @param {string} documentText - Document text
     * @returns {Promise<Object>} Content quality metrics
     */
    async analyzeContentQuality(documentText) {
        try {
            // Use quality standards if available
            if (this.components.qualityStandards) {
                return this.components.qualityStandards.analyzeTextQuality(documentText);
            }

            // Fallback to model-based analysis
            if (this.components.modelManager) {
                const prompt = `Analyze the following text and provide quality metrics for clarity, coherence, engagement, and correctness. Format your response as JSON.
                
                Text to analyze:
                """
                ${documentText.substring(0, 1000)}${documentText.length > 1000 ? '...' : ''}
                """`;

                const response = await this.components.modelManager.generateText(prompt, {
                    responseFormat: 'json'
                });

                try {
                    return JSON.parse(response);
                } catch (e) {
                    console.error('Error parsing quality analysis response:', e);
                    return { error: 'Failed to parse analysis' };
                }
            }

            return {
                error: 'No quality analysis components available'
            };
        } catch (error) {
            console.error('Error analyzing content quality:', error);
            return {
                error: error.message
            };
        }
    }

    /**
     * Identify improvement areas based on quality analysis
     * @param {Object} qualityMetrics - Quality metrics
     * @returns {Array<string>} Improvement areas
     */
    identifyImprovementAreas(qualityMetrics) {
        const improvementAreas = [];

        // Skip if no metrics or error occurred
        if (!qualityMetrics || qualityMetrics.error) {
            return improvementAreas;
        }

        // Check various metrics
        if (qualityMetrics.clarity && qualityMetrics.clarity < 0.7) {
            improvementAreas.push('clarity');
        }

        if (qualityMetrics.coherence && qualityMetrics.coherence < 0.7) {
            improvementAreas.push('coherence');
        }

        if (qualityMetrics.engagement && qualityMetrics.engagement < 0.6) {
            improvementAreas.push('engagement');
        }

        if (qualityMetrics.correctness && qualityMetrics.correctness < 0.8) {
            improvementAreas.push('correctness');
        }

        if (qualityMetrics.conciseness && qualityMetrics.conciseness < 0.6) {
            improvementAreas.push('conciseness');
        }

        return improvementAreas;
    }

    /**
     * Generate content with the multiverse writing system
     * @param {string} prompt - Content prompt
     * @param {Array<string>} styles - Style variations to generate
     * @returns {Promise<Object>} Generated variations
     */
    async generateMultiverseContent(prompt, styles = ['formal', 'casual', 'creative']) {
        if (!this.components.multiverseWriting) {
            throw new Error('Multiverse writing component not available');
        }

        try {
            // Switch to multiverse mode
            this.status.activeMode = 'multiverse';

            // Generate content variations
            const result = await this.components.multiverseWriting.generateVariants(prompt, styles);

            return result;
        } catch (error) {
            console.error('Error generating multiverse content:', error);
            throw error;
        } finally {
            // Switch back to standard mode
            this.status.activeMode = 'standard';
        }
    }

    /**
     * Recursively perfect text
     * @param {string} text - Text to perfect
     * @param {Object} options - Perfection options
     * @returns {Promise<string>} Perfected text
     */
    async perfectText(text, options = {}) {
        if (!this.components.recursiveOptimizer) {
            throw new Error('Recursive optimizer component not available');
        }

        try {
            // Switch to optimization mode
            this.status.activeMode = 'optimization';

            // Perfect the text
            const result = await this.components.recursiveOptimizer.optimize(text, options);

            return result;
        } catch (error) {
            console.error('Error perfecting text:', error);
            throw error;
        } finally {
            // Switch back to standard mode
            this.status.activeMode = 'standard';
        }
    }

    /**
     * Insert text into the current document
     * @param {string} text - Text to insert
     * @returns {Promise<boolean>} Success indicator
     */
    async insertTextIntoDocument(text) {
        if (!this.components.documentManager) {
            throw new Error('Document manager component not available');
        }

        try {
            const success = await this.components.documentManager.insertTextAtSelection(text);
            return success;
        } catch (error) {
            console.error('Error inserting text into document:', error);
            throw error;
        }
    }

    /**
     * Add event listener
     * @param {string} eventName - Event name
     * @param {Function} callback - Event callback
     */
    addEventListener(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }

        this.events[eventName].push(callback);
    }

    /**
     * Remove event listener
     * @param {string} eventName - Event name
     * @param {Function} callback - Event callback
     */
    removeEventListener(eventName, callback) {
        if (!this.events[eventName]) return;

        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }

    /**
     * Dispatch event
     * @param {string} eventName - Event name
     * @param {Object} data - Event data
     */
    dispatchEvent(eventName, data = {}) {
        if (!this.events[eventName]) return;

        for (const callback of this.events[eventName]) {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        }
    }
}

// Create global instance
const systemIntegration = new SystemIntegration();
