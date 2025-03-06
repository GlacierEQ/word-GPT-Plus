/**
 * Word GPT Plus - Workflow Automation Manager
 * Manages automated workflows and task sequences
 */

class WorkflowManager {
    constructor() {
        // Available workflow templates
        this.workflowTemplates = {
            documentImprovement: {
                name: "Document Improvement",
                description: "Multi-stage document improvement process",
                steps: [
                    {
                        id: "analyze",
                        name: "Document Analysis",
                        handler: "analyzeDocument",
                        requiredInput: ["documentText"],
                        output: ["documentStructure", "contentQuality", "improvementAreas"]
                    },
                    {
                        id: "optimize",
                        name: "Content Optimization",
                        handler: "optimizeContent",
                        requiredInput: ["documentText", "improvementAreas"],
                        output: ["optimizedContent"]
                    },
                    {
                        id: "format",
                        name: "Format Enhancement",
                        handler: "enhanceFormat",
                        requiredInput: ["optimizedContent", "documentStructure"],
                        output: ["formattedContent"]
                    }
                ],
                settings: {
                    automaticExecution: false,
                    requiredUserApproval: ["optimize", "format"],
                    notifyOnCompletion: true
                }
            },

            multiWritingStyle: {
                name: "Multi-Style Writing",
                description: "Generate multiple variations of content in different styles",
                steps: [
                    {
                        id: "baseGeneration",
                        name: "Base Content",
                        handler: "generateBaseContent",
                        requiredInput: ["promptText"],
                        output: ["baseContent"]
                    },
                    {
                        id: "styleVariations",
                        name: "Style Variations",
                        handler: "generateMultiverseVariants",
                        requiredInput: ["baseContent"],
                        output: ["contentVariants"]
                    },
                    {
                        id: "comparison",
                        name: "Comparison View",
                        handler: "displayMultiverseComparison",
                        requiredInput: ["contentVariants"],
                        output: ["selectedContent"]
                    }
                ],
                settings: {
                    automaticExecution: true,
                    requiredUserApproval: ["comparison"],
                    notifyOnCompletion: true
                }
            },

            smartEditing: {
                name: "Smart Editing",
                description: "Context-aware intelligent editing assistant",
                steps: [
                    {
                        id: "contextAnalysis",
                        name: "Context Analysis",
                        handler: "analyzeEditingContext",
                        requiredInput: ["documentText", "selectionText", "cursorPosition"],
                        output: ["contextData"]
                    },
                    {
                        id: "suggestionGeneration",
                        name: "Generate Suggestions",
                        handler: "generateEditingSuggestions",
                        requiredInput: ["contextData"],
                        output: ["editingSuggestions"]
                    },
                    {
                        id: "applySuggestion",
                        name: "Apply Suggestion",
                        handler: "applyEditingSuggestion",
                        requiredInput: ["editingSuggestions", "selectedSuggestion"],
                        output: ["editedText"]
                    }
                ],
                settings: {
                    automaticExecution: true,
                    requiredUserApproval: ["applySuggestion"],
                    notifyOnCompletion: false
                }
            }
        };

        // Active workflows
        this.activeWorkflows = {};

        // Workflow history
        this.workflowHistory = [];

        // Event handlers
        this.events = {
            onWorkflowStart: null,
            onWorkflowStepComplete: null,
            onWorkflowComplete: null,
            onWorkflowError: null
        };

        // Handler registry - maps step handler names to actual functions
        this.handlerRegistry = {};

        // Load saved workflows
        this.loadSavedWorkflows();
    }

    /**
     * Register a step handler function
     * @param {string} handlerName - Name of the handler
     * @param {Function} handlerFunction - Handler function
     */
    registerHandler(handlerName, handlerFunction) {
        this.handlerRegistry[handlerName] = handlerFunction;
        console.log(`Registered workflow handler: ${handlerName}`);
    }

    /**
     * Load saved custom workflows
     */
    loadSavedWorkflows() {
        try {
            const savedWorkflows = localStorage.getItem('wordGptPlusWorkflows');
            if (savedWorkflows) {
                const customWorkflows = JSON.parse(savedWorkflows);
                Object.assign(this.workflowTemplates, customWorkflows);
                console.log('Custom workflows loaded successfully');
            }
        } catch (error) {
            console.error('Error loading saved workflows:', error);
        }
    }

    /**
     * Save custom workflows
     */
    saveWorkflows() {
        try {
            // Filter out built-in workflows and save only custom ones
            const customWorkflows = {};
            Object.entries(this.workflowTemplates).forEach(([id, workflow]) => {
                if (workflow.custom === true) {
                    customWorkflows[id] = workflow;
                }
            });

            localStorage.setItem('wordGptPlusWorkflows', JSON.stringify(customWorkflows));
        } catch (error) {
            console.error('Error saving workflows:', error);
        }
    }

    /**
     * Create a new workflow instance
     * @param {string} templateId - Workflow template ID
     * @returns {string} Workflow instance ID
     */
    createWorkflow(templateId) {
        // Check if template exists
        const template = this.workflowTemplates[templateId];
        if (!template) {
            throw new Error(`Workflow template ${templateId} not found`);
        }

        // Generate workflow ID
        const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Create workflow instance
        this.activeWorkflows[workflowId] = {
            id: workflowId,
            templateId: templateId,
            name: template.name,
            steps: [...template.steps], // Clone steps
            status: 'created',
            currentStepIndex: -1,
            startTime: null,
            completionTime: null,
            data: {}, // Will hold input/output data
            settings: { ...template.settings } // Clone settings
        };

        console.log(`Created workflow: ${template.name} (${workflowId})`);
        return workflowId;
    }

    /**
     * Set input data for a workflow
     * @param {string} workflowId - Workflow ID
     * @param {Object} data - Input data
     */
    setWorkflowData(workflowId, data) {
        if (!this.activeWorkflows[workflowId]) {
            throw new Error(`Workflow ${workflowId} not found`);
        }

        // Merge data with existing workflow data
        this.activeWorkflows[workflowId].data = {
            ...this.activeWorkflows[workflowId].data,
            ...data
        };
    }

    /**
     * Start a workflow
     * @param {string} workflowId - Workflow ID
     * @returns {Promise} Workflow execution promise
     */
    async startWorkflow(workflowId) {
        const workflow = this.activeWorkflows[workflowId];
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }

        if (workflow.status === 'running') {
            console.warn(`Workflow ${workflowId} is already running`);
            return;
        }

        // Update status
        workflow.status = 'running';
        workflow.startTime = new Date().toISOString();
        workflow.currentStepIndex = 0;

        // Trigger workflow start event
        if (this.events.onWorkflowStart) {
            this.events.onWorkflowStart(workflow);
        }

        // Start with the first step
        return this.executeWorkflowStep(workflowId);
    }

    /**
     * Execute current step of a workflow
     * @param {string} workflowId - Workflow ID
     * @returns {Promise} Step execution promise
     */
    async executeWorkflowStep(workflowId) {
        const workflow = this.activeWorkflows[workflowId];
        if (!workflow || workflow.status !== 'running') {
            return;
        }

        const currentStep = workflow.steps[workflow.currentStepIndex];
        if (!currentStep) {
            // If no more steps, complete workflow
            return this.completeWorkflow(workflowId);
        }

        try {
            console.log(`Executing workflow step: ${currentStep.name}`);

            // Check if we have all required inputs
            for (const inputName of currentStep.requiredInput) {
                if (workflow.data[inputName] === undefined) {
                    throw new Error(`Missing required input: ${inputName}`);
                }
            }

            // Check if step requires user approval
            if (workflow.settings.requiredUserApproval &&
                workflow.settings.requiredUserApproval.includes(currentStep.id)) {

                // Pause workflow until approval
                workflow.status = 'awaiting_approval';
                console.log(`Workflow ${workflowId} is waiting for user approval for step: ${currentStep.name}`);

                // Return here - workflow will be continued when approveStep is called
                return {
                    status: 'awaiting_approval',
                    workflowId: workflowId,
                    stepId: currentStep.id,
                    stepName: currentStep.name
                };
            }

            // Execute step handler
            return await this.executeStepHandler(workflowId, currentStep);
        } catch (error) {
            return this.handleWorkflowError(workflowId, error);
        }
    }

    /**
     * Execute a step handler for a workflow step
     * @param {string} workflowId - Workflow ID
     * @param {Object} step - Step object
     * @returns {Promise} Handler execution promise
     */
    async executeStepHandler(workflowId, step) {
        const workflow = this.activeWorkflows[workflowId];
        const handler = this.handlerRegistry[step.handler];

        if (!handler) {
            throw new Error(`Handler not found: ${step.handler}`);
        }

        // Extract required inputs from workflow data
        const inputs = {};
        for (const inputName of step.requiredInput) {
            inputs[inputName] = workflow.data[inputName];
        }

        // Execute handler
        const result = await handler(inputs);

        // Store outputs in workflow data
        for (const outputName of step.output) {
            if (result[outputName] !== undefined) {
                workflow.data[outputName] = result[outputName];
            }
        }

        // Step complete - move to next step
        workflow.currentStepIndex++;

        // Trigger step completion event
        if (this.events.onWorkflowStepComplete) {
            this.events.onWorkflowStepComplete({
                workflowId,
                stepId: step.id,
                stepName: step.name,
                outputs: step.output.reduce((outputs, name) => {
                    outputs[name] = workflow.data[name];
                    return outputs;
                }, {})
            });
        }

        // Execute next step
        return this.executeWorkflowStep(workflowId);
    }

    /**
     * Approve a workflow step that requires user approval
     * @param {string} workflowId - Workflow ID
     * @param {Object} approvalData - Data provided with the approval
     * @returns {Promise} Continued workflow execution
     */
    async approveStep(workflowId, approvalData = {}) {
        const workflow = this.activeWorkflows[workflowId];
        if (!workflow || workflow.status !== 'awaiting_approval') {
            throw new Error(`Workflow ${workflowId} is not awaiting approval`);
        }

        // Add approval data to workflow data
        if (approvalData) {
            Object.assign(workflow.data, approvalData);
        }

        // Resume workflow
        workflow.status = 'running';

        // Execute step handler for current step
        const currentStep = workflow.steps[workflow.currentStepIndex];
        return await this.executeStepHandler(workflowId, currentStep);
    }

    /**
     * Reject a workflow step that requires user approval
     * @param {string} workflowId - Workflow ID
     * @param {string} reason - Rejection reason
     */
    rejectStep(workflowId, reason = '') {
        const workflow = this.activeWorkflows[workflowId];
        if (!workflow || workflow.status !== 'awaiting_approval') {
            throw new Error(`Workflow ${workflowId} is not awaiting approval`);
        }

        // Cancel the workflow
        workflow.status = 'cancelled';
        workflow.completionTime = new Date().toISOString();
        workflow.cancellationReason = reason;

        console.log(`Workflow ${workflowId} was cancelled: ${reason}`);

        // Add to history
        this.addWorkflowToHistory(workflowId);

        return {
            status: 'cancelled',
            workflowId: workflowId,
            reason: reason
        };
    }

    /**
     * Handle a workflow error
     * @param {string} workflowId - Workflow ID
     * @param {Error} error - Error object
     */
    handleWorkflowError(workflowId, error) {
        const workflow = this.activeWorkflows[workflowId];
        if (!workflow) return;

        // Update workflow status
        workflow.status = 'error';
        workflow.error = {
            message: error.message,
            stack: error.stack,
            stepIndex: workflow.currentStepIndex,
            stepName: workflow.steps[workflow.currentStepIndex]?.name || 'Unknown'
        };

        workflow.completionTime = new Date().toISOString();

        console.error(`Error in workflow ${workflowId}: ${error.message}`);

        // Trigger error event
        if (this.events.onWorkflowError) {
            this.events.onWorkflowError({
                workflowId,
                error: workflow.error
            });
        }

        // Add to history
        this.addWorkflowToHistory(workflowId);

        return {
            status: 'error',
            workflowId: workflowId,
            error: workflow.error
        };
    }

    /**
     * Complete a workflow successfully
     * @param {string} workflowId - Workflow ID
     */
    completeWorkflow(workflowId) {
        const workflow = this.activeWorkflows[workflowId];
        if (!workflow) return;

        // Update status
        workflow.status = 'completed';
        workflow.completionTime = new Date().toISOString();

        console.log(`Workflow ${workflowId} completed successfully`);

        // Trigger completion event
        if (this.events.onWorkflowComplete) {
            this.events.onWorkflowComplete({
                workflowId,
                data: workflow.data,
                duration: new Date(workflow.completionTime) - new Date(workflow.startTime)
            });
        }

        // Add to history
        this.addWorkflowToHistory(workflowId);

        // Show notification if needed
        if (workflow.settings.notifyOnCompletion) {
            this.showCompletionNotification(workflow);
        }

        return {
            status: 'completed',
            workflowId: workflowId,
            data: workflow.data
        };
    }

    /**
     * Add a completed workflow to history
     * @param {string} workflowId - Workflow ID
     */
    addWorkflowToHistory(workflowId) {
        const workflow = this.activeWorkflows[workflowId];
        if (!workflow) return;

        // Add to history
        this.workflowHistory.push({
            id: workflow.id,
            templateId: workflow.templateId,
            name: workflow.name,
            status: workflow.status,
            startTime: workflow.startTime,
            completionTime: workflow.completionTime,
            error: workflow.error
        });

        // Limit history size
        if (this.workflowHistory.length > 100) {
            this.workflowHistory = this.workflowHistory.slice(-100);
        }

        // Cleanup active workflow
        delete this.activeWorkflows[workflowId];
    }

    /**
     * Show completion notification
     * @param {Object} workflow - Workflow object
     */
    showCompletionNotification(workflow) {
        // In an actual implementation, this would show a notification
        console.log(`NOTIFICATION: Workflow "${workflow.name}" completed successfully`);
    }

    /**
     * Create a custom workflow template
     * @param {Object} template - Workflow template definition
     * @returns {string} Template ID
     */
    createWorkflowTemplate(template) {
        // Generate template ID
        const templateId = template.id || `workflow_${Date.now()}`;

        // Validate template
        if (!template.name) {
            throw new Error('Workflow template must have a name');
        }
        if (!template.steps || !Array.isArray(template.steps) || template.steps.length === 0) {
            throw new Error('Workflow template must have steps');
        }

        // Add to templates
        this.workflowTemplates[templateId] = {
            ...template,
            custom: true // Mark as custom template
        };

        // Save templates
        this.saveWorkflows();

        return templateId;
    }

    /**
     * Get the status of a workflow
     * @param {string} workflowId - Workflow ID
     * @returns {Object} Workflow status
     */
    getWorkflowStatus(workflowId) {
        const workflow = this.activeWorkflows[workflowId];
        if (!workflow) {
            // Check history
            const historicalWorkflow = this.workflowHistory.find(w => w.id === workflowId);
            if (historicalWorkflow) {
                return {
                    status: historicalWorkflow.status,
                    workflowId: workflowId,
                    name: historicalWorkflow.name,
                    startTime: historicalWorkflow.startTime,
                    completionTime: historicalWorkflow.completionTime,
                    error: historicalWorkflow.error
                };
            }
            return null;
        }

        return {
            workflowId: workflow.id,
            name: workflow.name,
            status: workflow.status,
            currentStep: workflow.currentStepIndex >= 0 ?
                workflow.steps[workflow.currentStepIndex].name : null,
            progress: {
                current: workflow.currentStepIndex + 1,
                total: workflow.steps.length
            },
            startTime: workflow.startTime
        };
    }

    /**
     * Get all available workflow templates
     * @returns {Object} Workflow templates
     */
    getWorkflowTemplates() {
        return this.workflowTemplates;
    }

    /**
     * Get workflow history
     * @param {number} limit - Maximum number of entries to return
     * @returns {Array} Workflow history
     */
    getWorkflowHistory(limit = 10) {
        return this.workflowHistory.slice(-limit);
    }
}

// Create global instance
const workflowManager = new WorkflowManager();
