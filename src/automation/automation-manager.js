/**
 * Word GPT Plus - Automation Manager
 * Central system for managing automated document tasks and workflows
 */

import documentAnalyzer from './document-analyzer.js';
import contentGenerator from './content-generator.js';
import formatConverter from './format-converter.js';
import citationManager from './citation-manager.js';
import batchProcessor from './batch-processor.js';
import { createAutomationUI } from './automation-ui.js';

class AutomationManager {
    constructor() {
        // Registry for available automations
        this.automations = {};

        // Active workflow trackers
        this.activeWorkflows = {};
        this.workflowHistory = [];

        // Configuration
        this.config = {
            maxConcurrentWorkflows: 3,
            defaultTimeoutMs: 60000, // 1 minute
            retryAttempts: 2,
            autoSave: true
        };

        // Initialize the system
        this.init();
    }

    /**
     * Initialize automation system
     */
    async init() {
        try {
            console.log('Initializing automation system...');

            // Register built-in automations
            this.registerBuiltInAutomations();

            // Load custom automations from storage
            await this.loadCustomAutomations();

            // Load config
            this.loadConfig();

            console.log('Automation system initialized with', Object.keys(this.automations).length, 'automations');
        } catch (error) {
            console.error('Failed to initialize automation system:', error);
        }
    }

    /**
     * Register all built-in automations
     */
    registerBuiltInAutomations() {
        // Document analysis automations
        this.registerAutomation('analyze-readability', {
            name: 'Analyze Readability',
            description: 'Analyze document readability and suggest improvements',
            category: 'analysis',
            handler: documentAnalyzer.analyzeReadability,
            params: [{
                name: 'target',
                type: 'string',
                enum: ['selection', 'document', 'paragraph'],
                default: 'selection'
            }]
        });

        this.registerAutomation('analyze-tone', {
            name: 'Analyze Tone',
            description: 'Identify document tone and sentiment',
            category: 'analysis',
            handler: documentAnalyzer.analyzeTone,
            params: [{
                name: 'target',
                type: 'string',
                enum: ['selection', 'document'],
                default: 'selection'
            }]
        });

        // Content generation automations
        this.registerAutomation('generate-outline', {
            name: 'Generate Outline',
            description: 'Create document outline based on topic',
            category: 'generation',
            handler: contentGenerator.generateOutline,
            params: [{
                name: 'topic',
                type: 'string',
                required: true
            }, {
                name: 'depth',
                type: 'number',
                default: 2,
                min: 1,
                max: 4
            }, {
                name: 'style',
                type: 'string',
                enum: ['academic', 'business', 'creative'],
                default: 'business'
            }]
        });

        this.registerAutomation('expand-bullet-points', {
            name: 'Expand Bullet Points',
            description: 'Convert bullet points to fully developed paragraphs',
            category: 'generation',
            handler: contentGenerator.expandBulletPoints
        });

        // Batch processing automations
        this.registerAutomation('batch-format-headings', {
            name: 'Format All Headings',
            description: 'Apply consistent formatting to all document headings',
            category: 'batch',
            handler: batchProcessor.formatHeadings
        });

        this.registerAutomation('batch-fix-grammar', {
            name: 'Fix Grammar Throughout',
            description: 'Find and fix grammar issues throughout document',
            category: 'batch',
            handler: batchProcessor.fixGrammar
        });

        // Citation automations
        this.registerAutomation('format-citations', {
            name: 'Format Citations',
            description: 'Format citations according to chosen style',
            category: 'academic',
            handler: citationManager.formatCitations,
            params: [{
                name: 'style',
                type: 'string',
                enum: ['APA', 'MLA', 'Chicago', 'Harvard'],
                default: 'APA'
            }]
        });

        this.registerAutomation('generate-bibliography', {
            name: 'Generate Bibliography',
            description: 'Create a bibliography from document citations',
            category: 'academic',
            handler: citationManager.generateBibliography
        });

        // Format conversion automations
        this.registerAutomation('smartify-quotes', {
            name: 'Convert to Smart Quotes',
            description: 'Convert straight quotes to smart quotes throughout document',
            category: 'formatting',
            handler: formatConverter.smartifyQuotes
        });

        this.registerAutomation('format-table', {
            name: 'Format Table',
            description: 'Apply professional formatting to selected table',
            category: 'formatting',
            handler: formatConverter.formatTable,
            params: [{
                name: 'style',
                type: 'string',
                enum: ['simple', 'striped', 'professional'],
                default: 'professional'
            }]
        });
    }

    /**
     * Register a new automation
     * @param {string} id - Unique automation identifier
     * @param {Object} automation - Automation definition
     */
    registerAutomation(id, automation) {
        if (this.automations[id]) {
            console.warn(`Overwriting existing automation: ${id}`);
        }

        this.automations[id] = {
            id,
            ...automation,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Load custom automations from storage
     */
    async loadCustomAutomations() {
        try {
            const stored = localStorage.getItem('wordGptPlusCustomAutomations');
            if (stored) {
                const customAutomations = JSON.parse(stored);

                // Register each custom automation
                Object.entries(customAutomations).forEach(([id, automation]) => {
                    // For custom automations, we need to reconstruct the handler function
                    if (automation.handlerCode) {
                        try {
                            // Use Function constructor to recreate function from string
                            // Note: This has security implications if sharing automations
                            automation.handler = new Function('context', 'params', automation.handlerCode);
                            this.registerAutomation(id, automation);
                        } catch (e) {
                            console.error(`Failed to load custom automation "${id}":`, e);
                        }
                    }
                });

                console.log(`Loaded ${Object.keys(customAutomations).length} custom automations`);
            }
        } catch (error) {
            console.error('Error loading custom automations:', error);
        }
    }

    /**
     * Load configuration from storage
     */
    loadConfig() {
        try {
            const storedConfig = localStorage.getItem('wordGptPlusAutomationConfig');
            if (storedConfig) {
                this.config = {
                    ...this.config,
                    ...JSON.parse(storedConfig)
                };
            }
        } catch (error) {
            console.error('Error loading automation config:', error);
        }
    }

    /**
     * Save configuration to storage
     */
    saveConfig() {
        try {
            localStorage.setItem('wordGptPlusAutomationConfig', JSON.stringify(this.config));
        } catch (error) {
            console.error('Error saving automation config:', error);
        }
    }

    /**
     * Run an automation
     * @param {string} id - Automation ID
     * @param {Object} params - Parameters for the automation
     * @returns {Promise<Object>} - Result of the automation
     */
    async runAutomation(id, params = {}) {
        // Check if automation exists
        if (!this.automations[id]) {
            throw new Error(`Automation "${id}" not found`);
        }

        const automation = this.automations[id];

        // Validate required parameters
        if (automation.params) {
            const missingParams = automation.params
                .filter(param => param.required && !params[param.name])
                .map(param => param.name);

            if (missingParams.length > 0) {
                throw new Error(`Missing required parameters for "${id}": ${missingParams.join(', ')}`);
            }
        }

        // Generate workflow ID
        const workflowId = `wf_${Date.now()}_${id}`;

        try {
            // Track workflow
            this.activeWorkflows[workflowId] = {
                id: workflowId,
                automationId: id,
                params,
                startTime: Date.now(),
                status: 'running'
            };

            // Create Word context
            const context = await this.createWordContext();

            // Execute the automation
            console.log(`Running automation "${id}" with params:`, params);
            const result = await automation.handler(context, params);

            // Update workflow status
            this.activeWorkflows[workflowId].status = 'completed';
            this.activeWorkflows[workflowId].endTime = Date.now();
            this.activeWorkflows[workflowId].result = result;

            // Add to history
            this.addToHistory(this.activeWorkflows[workflowId]);

            // Clean up
            delete this.activeWorkflows[workflowId];

            return {
                success: true,
                workflowId,
                result
            };

        } catch (error) {
            console.error(`Error running automation "${id}":`, error);

            // Update workflow status
            if (this.activeWorkflows[workflowId]) {
                this.activeWorkflows[workflowId].status = 'failed';
                this.activeWorkflows[workflowId].endTime = Date.now();
                this.activeWorkflows[workflowId].error = error.message;

                // Add to history
                this.addToHistory(this.activeWorkflows[workflowId]);

                // Clean up
                delete this.activeWorkflows[workflowId];
            }

            return {
                success: false,
                workflowId,
                error: error.message
            };
        }
    }

    /**
     * Create Word context for automation
     */
    async createWordContext() {
        return new Promise((resolve, reject) => {
            try {
                Word.run(async context => {
                    resolve(context);
                }).catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Add completed workflow to history
     * @param {Object} workflow - Workflow data
     */
    addToHistory(workflow) {
        this.workflowHistory.unshift(workflow);

        // Keep history to reasonable size
        if (this.workflowHistory.length > 50) {
            this.workflowHistory.length = 50;
        }

        // Persist history
        try {
            localStorage.setItem('wordGptPlusAutomationHistory', JSON.stringify(this.workflowHistory));
        } catch (error) {
            console.error('Error saving automation history:', error);
        }
    }

    /**
     * Create a new custom automation
     * @param {Object} automation - Custom automation definition
     * @returns {string} - ID of created automation
     */
    createCustomAutomation(automation) {
        // Generate ID
        const id = `custom_${Date.now()}`;

        // Store handler as string for persistence
        const handlerCode = automation.handler.toString();

        // Register the automation
        this.registerAutomation(id, {
            ...automation,
            handlerCode,
            isCustom: true
        });

        // Persist custom automations
        this.saveCustomAutomations();

        return id;
    }

    /**
     * Save custom automations to storage
     */
    saveCustomAutomations() {
        try {
            // Filter to just custom automations
            const customAutomations = Object.fromEntries(
                Object.entries(this.automations)
                    .filter(([_, automation]) => automation.isCustom)
            );

            localStorage.setItem('wordGptPlusCustomAutomations', JSON.stringify(customAutomations));
        } catch (error) {
            console.error('Error saving custom automations:', error);
        }
    }

    /**
     * Get categories and their automations
     * @returns {Object} - Categories with automations
     */
    getAutomationsByCategory() {
        const categories = {};

        Object.values(this.automations).forEach(automation => {
            const category = automation.category || 'other';

            if (!categories[category]) {
                categories[category] = [];
            }

            categories[category].push(automation);
        });

        // Sort automations in each category by name
        Object.values(categories).forEach(automations => {
            automations.sort((a, b) => a.name.localeCompare(b.name));
        });

        return categories;
    }

    /**
     * Create automation UI
     * @param {HTMLElement} container - Container element
     * @returns {Object} - UI controller
     */
    createUI(container) {
        return createAutomationUI(this, container);
    }
}

// Create and export singleton
const automationManager = new AutomationManager();
export default automationManager;
