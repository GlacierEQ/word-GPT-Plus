/**
 * Word GPT Plus - AI Model Manager
 * Manages different AI models, including quantized local models and API-based models
 */

class ModelManager {
    constructor() {
        // Available model types
        this.modelTypes = {
            API: 'api',              // Cloud API-based models (OpenAI, Azure, etc.)
            LOCAL: 'local',          // Local models running on device
            HYBRID: 'hybrid'         // Hybrid approach (local for small tasks, API for complex)
        };

        // Available models configuration
        this.availableModels = {
            // API models
            'gpt-4': {
                type: this.modelTypes.API,
                name: 'GPT-4',
                provider: 'openai',
                capabilities: ['text', 'reasoning', 'creative', 'code', 'multiverse'],
                contextLength: 8192,
                requiresKey: true,
                pricing: '0.03/1K tokens',
                recommended: true
            },
            'gpt-3.5-turbo': {
                type: this.modelTypes.API,
                name: 'GPT-3.5 Turbo',
                provider: 'openai',
                capabilities: ['text', 'reasoning', 'code'],
                contextLength: 4096,
                requiresKey: true,
                pricing: '0.002/1K tokens',
                recommended: false
            },
            'azure-gpt4': {
                type: this.modelTypes.API,
                name: 'Azure GPT-4',
                provider: 'azure',
                capabilities: ['text', 'reasoning', 'creative', 'code', 'multiverse'],
                contextLength: 8192,
                requiresKey: true,
                pricing: 'Based on Azure subscription',
                recommended: false
            },

            // Local quantized models
            'llama2-7b-q4': {
                type: this.modelTypes.LOCAL,
                name: 'Llama 2 (7B 4-bit)',
                provider: 'local',
                capabilities: ['text', 'basic-reasoning', 'simple-code'],
                contextLength: 2048,
                requiresKey: false,
                pricing: 'Free',
                fileSize: '4.2 GB',
                memoryNeeded: '6 GB RAM',
                recommended: true,
                downloadUrl: 'https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q4_K_M.gguf'
            },
            'mistral-7b-q4': {
                type: this.modelTypes.LOCAL,
                name: 'Mistral (7B 4-bit)',
                provider: 'local',
                capabilities: ['text', 'reasoning', 'simple-code'],
                contextLength: 8192,
                requiresKey: false,
                pricing: 'Free',
                fileSize: '4.1 GB',
                memoryNeeded: '6 GB RAM',
                recommended: false,
                downloadUrl: 'https://huggingface.co/TheBloke/Mistral-7B-v0.1-GGUF/resolve/main/mistral-7b-v0.1.Q4_K_M.gguf'
            },
            'phi2-q4': {
                type: this.modelTypes.LOCAL,
                name: 'Phi-2 (4-bit)',
                provider: 'local',
                capabilities: ['text', 'basic-reasoning'],
                contextLength: 2048,
                requiresKey: false,
                pricing: 'Free',
                fileSize: '1.8 GB',
                memoryNeeded: '3 GB RAM',
                recommended: false,
                downloadUrl: 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf'
            },

            // Hybrid configurations
            'hybrid-efficient': {
                type: this.modelTypes.HYBRID,
                name: 'Hybrid Efficient',
                provider: 'hybrid',
                capabilities: ['text', 'reasoning', 'code'],
                description: 'Uses local model for drafting and small edits, API for complex tasks',
                requiresKey: true, // API key still required for complex operations
                pricing: 'Reduced API usage',
                recommended: false,
                models: {
                    local: 'llama2-7b-q4',
                    api: 'gpt-3.5-turbo'
                },
                thresholds: {
                    maxLocalTokens: 1024,
                    complexityThreshold: 0.7
                }
            }
        };

        // Current active model
        this.activeModel = null;

        // Model instances (for local models)
        this.modelInstances = {};

        // Status of local models
        this.localModelStatus = {
            downloaded: {},
            initialized: {}
        };

        // Configuration
        this.config = {
            preferOffline: false,
            automaticDownload: false,
            downloadPath: './models',
            maxMemoryUsage: 0.7, // 70% of available memory
            useGPU: true,
            threads: 4
        };

        // Check installed models on startup
        this.checkInstalledModels();

        // Load last used model
        this.loadModelPreference();
    }

    /**
     * Get all available models
     * @param {boolean} includeUnavailable - Whether to include models that aren't available locally
     * @returns {Object} Available models
     */
    getAvailableModels(includeUnavailable = true) {
        if (includeUnavailable) {
            return this.availableModels;
        } else {
            // Filter to only include downloaded local models or API models
            const result = {};
            Object.entries(this.availableModels).forEach(([id, model]) => {
                if (model.type === this.modelTypes.API ||
                    (model.type === this.modelTypes.LOCAL && this.localModelStatus.downloaded[id]) ||
                    (model.type === this.modelTypes.HYBRID &&
                        this.localModelStatus.downloaded[model.models.local])) {
                    result[id] = model;
                }
            });
            return result;
        }
    }

    /**
     * Check which local models are installed
     */
    async checkInstalledModels() {
        try {
            // In web environment, check localStorage or IndexedDB
            // In desktop environment, check filesystem

            // For now, simulate with localStorage
            const downloadedModels = localStorage.getItem('wordGptPlusDownloadedModels');
            if (downloadedModels) {
                this.localModelStatus.downloaded = JSON.parse(downloadedModels);
            }

            console.log('Checked installed models:', this.localModelStatus.downloaded);
        } catch (error) {
            console.error('Error checking installed models:', error);
        }
    }

    /**
     * Load saved model preference
     */
    loadModelPreference() {
        try {
            const savedModel = localStorage.getItem('wordGptPlusModelPreference');
            if (savedModel && this.availableModels[savedModel]) {
                this.activeModel = savedModel;
            } else {
                // Set recommended model as default
                const recommended = Object.entries(this.availableModels)
                    .find(([_, model]) => model.recommended);

                if (recommended) {
                    this.activeModel = recommended[0];
                } else {
                    // Fallback to first API model if no recommended
                    const firstApi = Object.entries(this.availableModels)
                        .find(([_, model]) => model.type === this.modelTypes.API);

                    if (firstApi) {
                        this.activeModel = firstApi[0];
                    }
                }
            }

            console.log('Active model set to:', this.activeModel);
        } catch (error) {
            console.error('Error loading model preference:', error);
        }
    }

    /**
     * Set the active model
     * @param {string} modelId - Model identifier
     * @returns {boolean} Success indicator
     */
    async setActiveModel(modelId) {
        if (!this.availableModels[modelId]) {
            console.error(`Model ${modelId} not found`);
            return false;
        }

        const model = this.availableModels[modelId];

        // Check if model is available
        if (model.type === this.modelTypes.LOCAL &&
            !this.localModelStatus.downloaded[modelId]) {

            // Handle model not downloaded
            const shouldDownload = confirm(
                `The model ${model.name} is not downloaded yet. ` +
                `It requires ${model.fileSize} of storage and ${model.memoryNeeded} to run. ` +
                `Would you like to download it now?`
            );

            if (shouldDownload) {
                try {
                    await this.downloadModel(modelId);
                } catch (error) {
                    console.error(`Failed to download model ${modelId}:`, error);
                    return false;
                }
            } else {
                return false;
            }
        }

        // Handle hybrid model
        if (model.type === this.modelTypes.HYBRID) {
            const localModelId = model.models.local;
            if (!this.localModelStatus.downloaded[localModelId]) {
                const shouldDownload = confirm(
                    `The hybrid setup requires the local model ${this.availableModels[localModelId].name} ` +
                    `which is not downloaded yet. ` +
                    `It requires ${this.availableModels[localModelId].fileSize} of storage and ` +
                    `${this.availableModels[localModelId].memoryNeeded} to run. ` +
                    `Would you like to download it now?`
                );

                if (shouldDownload) {
                    try {
                        await this.downloadModel(localModelId);
                    } catch (error) {
                        console.error(`Failed to download model ${localModelId}:`, error);
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        // If API model, verify key availability
        if ((model.type === this.modelTypes.API || model.type === this.modelTypes.HYBRID) &&
            model.requiresKey) {

            const apiConfig = this.getApiConfig();
            if (!apiConfig || !apiConfig.apiKey) {
                alert(`The model ${model.name} requires an API key. Please configure it in Settings.`);
                return false;
            }
        }

        // Set the active model
        this.activeModel = modelId;
        localStorage.setItem('wordGptPlusModelPreference', modelId);

        // Initialize the model if needed
        if ((model.type === this.modelTypes.LOCAL || model.type === this.modelTypes.HYBRID) &&
            this.localModelStatus.downloaded[modelId] &&
            !this.localModelStatus.initialized[modelId]) {

            try {
                await this.initializeModel(modelId);
            } catch (error) {
                console.error(`Failed to initialize model ${modelId}:`, error);
                return false;
            }
        }

        console.log(`Active model set to ${modelId}`);
        return true;
    }

    /**
     * Get current API configuration
     * @returns {Object|null} API config object or null if not configured
     */
    getApiConfig() {
        try {
            const apiConfig = localStorage.getItem('wordGptPlusApiConfig');
            return apiConfig ? JSON.parse(apiConfig) : null;
        } catch (error) {
            console.error('Error retrieving API config:', error);
            return null;
        }
    }

    /**
     * Download a local model
     * @param {string} modelId - Model identifier
     * @returns {Promise} Download promise
     */
    async downloadModel(modelId) {
        const model = this.availableModels[modelId];
        if (!model || model.type !== this.modelTypes.LOCAL) {
            throw new Error(`Invalid model ${modelId} for download`);
        }

        // Update status to show download started
        const downloadProgress = document.createElement('div');
        downloadProgress.id = 'download-progress';
        downloadProgress.style.position = 'fixed';
        downloadProgress.style.bottom = '20px';
        downloadProgress.style.right = '20px';
        downloadProgress.style.padding = '10px';
        downloadProgress.style.backgroundColor = '#f0f0f0';
        downloadProgress.style.border = '1px solid #ccc';
        downloadProgress.style.borderRadius = '4px';
        downloadProgress.style.zIndex = 1000;
        downloadProgress.innerHTML = `
            <div>Downloading ${model.name}...</div>
            <progress value="0" max="100" style="width: 100%"></progress>
            <div id="download-status">Initializing...</div>
        `;
        document.body.appendChild(downloadProgress);

        try {
            // In a web-based environment, we might download to IndexedDB
            // In a desktop app, we'd download to the filesystem

            // Simulate download - in a real implementation, we would download the model file
            return new Promise(resolve => {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 5;

                    // Update progress bar
                    const progressBar = downloadProgress.querySelector('progress');
                    const status = downloadProgress.querySelector('#download-status');
                    if (progressBar && status) {
                        progressBar.value = progress;
                        status.textContent = `${progress}% (${Math.round(progress / 100 * parseFloat(model.fileSize))} / ${model.fileSize})`;
                    }

                    if (progress >= 100) {
                        clearInterval(interval);

                        // Mark as downloaded
                        this.localModelStatus.downloaded[modelId] = true;
                        localStorage.setItem(
                            'wordGptPlusDownloadedModels',
                            JSON.stringify(this.localModelStatus.downloaded)
                        );

                        // Remove progress display
                        document.body.removeChild(downloadProgress);

                        resolve();
                    }
                }, 500); // Simulate slow download for demonstration
            });
        } catch (error) {
            // Remove progress display on error
            if (document.body.contains(downloadProgress)) {
                document.body.removeChild(downloadProgress);
            }
            throw error;
        }
    }

    /**
     * Initialize a model for use
     * @param {string} modelId - Model identifier
     * @returns {Promise} Initialization promise
     */
    async initializeModel(modelId) {
        const model = this.availableModels[modelId];
        if (!model) {
            throw new Error(`Invalid model ${modelId}`);
        }

        // If it's a hybrid model, initialize the local component
        if (model.type === this.modelTypes.HYBRID) {
            return this.initializeModel(model.models.local);
        }

        // If it's not a local model, no initialization needed
        if (model.type !== this.modelTypes.LOCAL) {
            return Promise.resolve();
        }

        // Check if already initialized
        if (this.localModelStatus.initialized[modelId]) {
            console.log(`Model ${modelId} already initialized`);
            return Promise.resolve();
        }

        // Check if downloaded
        if (!this.localModelStatus.downloaded[modelId]) {
            throw new Error(`Model ${modelId} not downloaded`);
        }

        console.log(`Initializing model ${modelId}...`);

        try {
            // In a real implementation, we would load the model into memory
            // and prepare it for inference

            // Simulate initialization
            return new Promise(resolve => {
                setTimeout(() => {
                    // Create a simulated model instance
                    this.modelInstances[modelId] = {
                        modelId,
                        name: model.name,
                        ready: true,
                        generate: async (prompt, options) => this.simulateLocalModelResponse(prompt, model, options)
                    };

                    // Mark as initialized
                    this.localModelStatus.initialized[modelId] = true;
                    console.log(`Model ${modelId} initialized successfully`);
                    resolve();
                }, 2000); // Simulate initialization time
            });
        } catch (error) {
            console.error(`Error initializing model ${modelId}:`, error);
            throw error;
        }
    }

    /**
     * Simulate a local model response for demonstration purposes
     * @private
     */
    async simulateLocalModelResponse(prompt, model, options = {}) {
        console.log(`Generating response with local model ${model.name}`, options);

        // Simulate thinking time proportional to prompt length and options
        const thinkingTime = Math.min(3000, prompt.length / 2);

        return new Promise(resolve => {
            setTimeout(() => {
                // Generate a simulated response
                const responses = [
                    `As a local ${model.name} model, I've analyzed your request. ${prompt.length > 100 ? 'This is a detailed response to your complex query.' : 'Here is a simple answer to your question.'} The key points to consider are: (1) local processing is private, (2) response quality depends on the model size, and (3) no internet connection is required for generation.`,

                    `Running locally on your device, I can provide a response to "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}". While I don't have internet access to retrieve real-time information, I can work with the knowledge contained in my parameters. The benefit of local processing is enhanced privacy and no dependency on external API services.`,

                    `Based on your prompt about ${prompt.split(' ').slice(0, 3).join(' ')}..., I can offer insights within my capabilities as a ${model.name} model. Please note that as a quantized local model, my responses might be less nuanced than cloud-based alternatives, but I offer the advantage of complete privacy and offline functionality.`
                ];

                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                resolve(randomResponse);
            }, thinkingTime);
        });
    }

    /**
     * Generate text with the current active model
     * @param {string} prompt - Input prompt
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Generated text
     */
    async generateText(prompt, options = {}) {
        if (!this.activeModel) {
            throw new Error('No active model selected');
        }

        const model = this.availableModels[this.activeModel];
        if (!model) {
            throw new Error(`Invalid active model: ${this.activeModel}`);
        }

        // Track start time for performance metrics
        const startTime = performance.now();

        try {
            let response;

            // Handle different model types
            if (model.type === this.modelTypes.LOCAL) {
                // Ensure model is initialized
                if (!this.localModelStatus.initialized[this.activeModel]) {
                    await this.initializeModel(this.activeModel);
                }

                // Generate with local model
                const localModel = this.modelInstances[this.activeModel];
                response = await localModel.generate(prompt, options);

            } else if (model.type === this.modelTypes.API) {
                // Generate with API model
                response = await this.generateWithApi(prompt, model, options);

            } else if (model.type === this.modelTypes.HYBRID) {
                // Decide whether to use local or API based on complexity and length
                const complexity = this.estimatePromptComplexity(prompt);
                const tokenEstimate = this.estimateTokenCount(prompt);

                if (complexity < model.thresholds.complexityThreshold &&
                    tokenEstimate < model.thresholds.maxLocalTokens) {
                    // Use local model for simple, short tasks
                    const localModelId = model.models.local;

                    // Ensure local model is initialized
                    if (!this.localModelStatus.initialized[localModelId]) {
                        await this.initializeModel(localModelId);
                    }

                    // Generate with local model
                    const localModel = this.modelInstances[localModelId];
                    response = await localModel.generate(prompt, options);
                } else {
                    // Use API model for complex tasks
                    const apiModelId = model.models.api;
                    const apiModel = this.availableModels[apiModelId];
                    response = await this.generateWithApi(prompt, apiModel, options);
                }
            }

            // Calculate performance metrics
            const endTime = performance.now();
            const processingTime = endTime - startTime;

            // Update usage statistics
            this.updateUsageStats(this.activeModel, {
                promptLength: prompt.length,
                responseLength: response.length,
                processingTime: processingTime
            });

            return response;

        } catch (error) {
            console.error('Text generation error:', error);
            throw error;
        }
    }

    /**
     * Generate text with an API-based model
     * @private
     */
    async generateWithApi(prompt, model, options = {}) {
        // Get API configuration
        const apiConfig = this.getApiConfig();
        if (!apiConfig || !apiConfig.apiKey) {
            throw new Error('API key not configured');
        }

        if (model.provider === 'openai') {
            // OpenAI API call
            const response = await this.callOpenAiApi(prompt, model.name, apiConfig.apiKey, options);
            return response;
        } else if (model.provider === 'azure') {
            // Azure API call
            const response = await this.callAzureApi(prompt, apiConfig.apiKey, options);
            return response;
        } else {
            throw new Error(`Unsupported API provider: ${model.provider}`);
        }
    }

    /**
     * Call OpenAI API (simplified for demonstration)
     * @private
     */
    async callOpenAiApi(prompt, model, apiKey, options = {}) {
        console.log(`Calling OpenAI API with model ${model}...`);

        // In a real implementation, we would make an actual API call
        // This is a simplified simulation for demonstration purposes

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    // Simulate API response
                    resolve(`[OpenAI ${model}] Response to: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\nI've processed your request and here's a comprehensive analysis. The key factors to consider are context, relevance, and application. Let me elaborate on each point...\n\n${options.detailed ? 'This is a more detailed response because you requested additional details in your options.' : ''}`);
                } catch (error) {
                    reject(new Error(`API Error: ${error.message}`));
                }
            }, 1000);
        });
    }

    /**
     * Call Azure API (simplified for demonstration)
     * @private
     */
    async callAzureApi(prompt, apiKey, options = {}) {
        console.log('Calling Azure API...');

        // Simulate API response
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    resolve(`[Azure AI] I've analyzed your request regarding "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\nBased on my training, I can provide the following insights. First, let's consider the core concepts involved. Then we'll explore practical applications and potential challenges...\n\n${options.detailed ? 'Since detailed information was requested, I've included additional analysis and examples.' : ''}`);
                } catch (error) {
                    reject(new Error(`Azure API Error: ${error.message}`));
                }
            }, 1500);
        });
    }

    /**
     * Estimate prompt complexity for hybrid mode decisions
     * @private
     */
    estimatePromptComplexity(prompt) {
        // Simple heuristic for complexity estimation:
        // - Length factor: Longer prompts are more complex
        // - Structure factor: More structure indicators suggest complexity
        // - Question factor: More questions suggest complexity

        const lengthFactor = Math.min(1, prompt.length / 1000);

        const structureIndicators = [
            'compare', 'analyze', 'explain', 'synthesize', 'evaluate',
            'critique', 'justify', 'elaborate', 'differentiate'
        ];

        let structureCount = 0;
        structureIndicators.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = prompt.match(regex);
            if (matches) {
                structureCount += matches.length;
            }
        });

        const structureFactor = Math.min(1, structureCount / 5);

        const questionCount = (prompt.match(/\?/g) || []).length;
        const questionFactor = Math.min(1, questionCount / 3);

        // Combined complexity score (0-1)
        return (lengthFactor * 0.4) + (structureFactor * 0.4) + (questionFactor * 0.2);
    }

    /**
     * Estimate token count for a text
     * @private
     */
    estimateTokenCount(text) {
        // Very rough estimation: ~1.3 tokens per word
        const words = text.split(/\s+/).length;
        return Math.ceil(words * 1.3);
    }

    /**
     * Update usage statistics
     * @private
     */
    updateUsageStats(modelId, stats) {
        try {
            // Get existing stats
            const usageStatsStr = localStorage.getItem('wordGptPlusModelUsage');
            const usageStats = usageStatsStr ? JSON.parse(usageStatsStr) : {};

            // Initialize model stats if needed
            if (!usageStats[modelId]) {
                usageStats[modelId] = {
                    usageCount: 0,
                    totalPromptLength: 0,
                    totalResponseLength: 0,
                    totalProcessingTime: 0,
                    lastUsed: null
                };
            }

            // Update stats
            const modelStats = usageStats[modelId];
            modelStats.usageCount++;
            modelStats.totalPromptLength += stats.promptLength;
            modelStats.totalResponseLength += stats.responseLength;
            modelStats.totalProcessingTime += stats.processingTime;
            modelStats.lastUsed = new Date().toISOString();

            // Save updated stats
            localStorage.setItem('wordGptPlusModelUsage', JSON.stringify(usageStats));
        } catch (error) {
            console.error('Error updating usage stats:', error);
        }
    }

    /**
     * Get a summary of model usage statistics
     * @returns {Object} Usage statistics
     */
    getUsageStatistics() {
        try {
            const usageStatsStr = localStorage.getItem('wordGptPlusModelUsage');
            const usageStats = usageStatsStr ? JSON.parse(usageStatsStr) : {};

            // Calculate additional metrics
            Object.values(usageStats).forEach(stats => {
                if (stats.usageCount > 0) {
                    stats.avgPromptLength = stats.totalPromptLength / stats.usageCount;
                    stats.avgResponseLength = stats.totalResponseLength / stats.usageCount;
                    stats.avgProcessingTime = stats.totalProcessingTime / stats.usageCount;
                }
            });

            return usageStats;
        } catch (error) {
            console.error('Error getting usage stats:', error);
            return {};
        }
    }

    /**
     * Delete a downloaded model
     * @param {string} modelId - Model identifier
     * @returns {boolean} Success indicator
     */
    async deleteModel(modelId) {
        const model = this.availableModels[modelId];
        if (!model || model.type !== this.modelTypes.LOCAL) {
            return false;
        }

        // Check if model is currently active
        if (this.activeModel === modelId) {
            alert(`Cannot delete model "${model.name}" because it is currently active. Please switch to another model first.`);
            return false;
        }

        // Confirm deletion
        const confirmed = confirm(`Are you sure you want to delete the model "${model.name}"? This will free up ${model.fileSize} of storage.`);

        if (!confirmed) {
            return false;
        }

        try {
            // Remove model from various storages
            delete this.localModelStatus.downloaded[modelId];
            delete this.localModelStatus.initialized[modelId];
            delete this.modelInstances[modelId];

            // Update localStorage
            localStorage.setItem(
                'wordGptPlusDownloadedModels',
                JSON.stringify(this.localModelStatus.downloaded)
            );

            console.log(`Model ${modelId} deleted successfully`);
            return true;
        } catch (error) {
            console.error(`Error deleting model ${modelId}:`, error);
            return false;
        }
    }

    /**
     * Get estimated API costs for a given prompt
     * @param {string} prompt - Input prompt
     * @returns {Object} Cost estimates for different models
     */
    getApiCostEstimate(prompt) {
        const tokenEstimate = this.estimateTokenCount(prompt);
        const responseTokenEstimate = tokenEstimate * 1.5; // Estimate response length

        const estimates = {};

        // Calculate for API models
        Object.entries(this.availableModels)
            .filter(([_, model]) => model.type === this.modelTypes.API)
            .forEach(([id, model]) => {
                let costPerToken;

                if (model.provider === 'openai') {
                    // Simplified pricing model
                    if (model.name === 'GPT-4') {
                        costPerToken = 0.00003; // $0.03 per 1K tokens
                    } else if (model.name === 'GPT-3.5 Turbo') {
                        costPerToken = 0.000002; // $0.002 per 1K tokens
                    } else {
                        costPerToken = 0.00001; // Generic estimate
                    }
                } else {
                    // For other providers, use a generic estimate
                    costPerToken = 0.00001;
                }

                // Calculate total cost
                const totalTokens = tokenEstimate + responseTokenEstimate;
                const cost = totalTokens * costPerToken;

                estimates[id] = {
                    promptTokens: tokenEstimate,
                    estimatedResponseTokens: responseTokenEstimate,
                    totalTokens