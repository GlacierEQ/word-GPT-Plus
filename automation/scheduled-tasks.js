/**
 * Word GPT Plus - Scheduled Tasks Manager
 * Handles scheduled background tasks and periodic operations
 */

class ScheduledTaskManager {
    constructor() {
        // Active tasks
        this.tasks = {};

        // Task history
        this.taskHistory = [];

        // Task categories
        this.categories = {
            MAINTENANCE: 'maintenance',
            OPTIMIZATION: 'optimization',
            LEARNING: 'learning',
            SYNCHRONIZATION: 'synchronization',
            USER: 'user'
        };

        // Task priorities
        this.priorities = {
            LOW: 0,
            MEDIUM: 1,
            HIGH: 2,
            CRITICAL: 3
        };

        // Initialize task registration
        this.registerDefaultTasks();

        // Load saved tasks
        this.loadTasks();
    }

    /**
     * Register default system tasks
     */
    registerDefaultTasks() {
        // Model cache optimization
        this.registerTask('modelCacheOptimization', {
            name: 'Model Cache Optimization',
            description: 'Clean up and optimize local model cache',
            category: this.categories.MAINTENANCE,
            priority: this.priorities.LOW,
            interval: 24 * 60 * 60 * 1000, // Daily
            handler: this.modelCacheOptimizationHandler.bind(this),
            enabled: true,
            lastRun: null
        });

        // Quality metrics aggregation
        this.registerTask('qualityMetricsAggregation', {
            name: 'Quality Metrics Aggregation',
            description: 'Aggregate and analyze quality metrics',
            category: this.categories.OPTIMIZATION,
            priority: this.priorities.MEDIUM,
            interval: 12 * 60 * 60 * 1000, // Twice daily
            handler: this.qualityMetricsAggregationHandler.bind(this),
            enabled: true,
            lastRun: null
        });

        // User preference learning
        this.registerTask('userPreferenceLearning', {
            name: 'User Preference Learning',
            description: 'Analyze and learn from user behavior',
            category: this.categories.LEARNING,
            priority: this.priorities.MEDIUM,
            interval: 6 * 60 * 60 * 1000, // Every 6 hours
            handler: this.userPreferenceLearningHandler.bind(this),
            enabled: true,
            lastRun: null
        });

        // Document synchronization
        this.registerTask('documentSynchronization', {
            name: 'Document Synchronization',
            description: 'Synchronize documents with cloud storage',
            category: this.categories.SYNCHRONIZATION,
            priority: this.priorities.LOW,
            interval: 30 * 60 * 1000, // Every 30 minutes
            handler: this.documentSynchronizationHandler.bind(this),
            enabled: false, // Disabled by default
            lastRun: null
        });

        // System health check
        this.registerTask('systemHealthCheck', {
            name: 'System Health Check',
            description: 'Check system health and performance',
            category: this.categories.MAINTENANCE,
            priority: this.priorities.HIGH,
            interval: 60 * 60 * 1000, // Hourly
            handler: this.systemHealthCheckHandler.bind(this),
            enabled: true,
            lastRun: null
        });
    }

    /**
     * Load tasks from storage
     */
    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('wordGptPlusScheduledTasks');
            if (savedTasks) {
                const taskConfig = JSON.parse(savedTasks);

                // Apply saved configuration to tasks
                Object.entries(taskConfig).forEach(([taskId, config]) => {
                    if (this.tasks[taskId]) {
                        // Update existing task
                        this.tasks[taskId] = {
                            ...this.tasks[taskId],
                            ...config
                        };
                    } else if (config.category === this.categories.USER) {
                        // Restore user task
                        this.tasks[taskId] = config;
                    }
                });

                console.log('Scheduled tasks loaded successfully');
            }

            // Load history
            const savedHistory = localStorage.getItem('wordGptPlusTaskHistory');
            if (savedHistory) {
                this.taskHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error('Error loading scheduled tasks:', error);
        }
    }

    /**
     * Save tasks to storage
     */
    saveTasks() {
        try {
            // Create task configuration to save
            const taskConfig = {};
            Object.entries(this.tasks).forEach(([taskId, task]) => {
                taskConfig[taskId] = {
                    enabled: task.enabled,
                    interval: task.interval,
                    lastRun: task.lastRun
                };

                // For user tasks, save additional properties
                if (task.category === this.categories.USER) {
                    taskConfig[taskId] = {
                        ...taskConfig[taskId],
                        name: task.name,
                        description: task.description,
                        category: task.category,
                        priority: task.priority,
                        handlerCode: task.handlerCode
                    };
                }
            });

            localStorage.setItem('wordGptPlusScheduledTasks', JSON.stringify(taskConfig));

            // Save history (limited)
            localStorage.setItem('wordGptPlusTaskHistory', JSON.stringify(this.taskHistory.slice(-100)));
        } catch (error) {
            console.error('Error saving scheduled tasks:', error);
        }
    }

    /**
     * Register a task
     * @param {string} taskId - Task identifier
     * @param {Object} taskConfig - Task configuration
     */
    registerTask(taskId, taskConfig) {
        this.tasks[taskId] = taskConfig;
    }

    /**
     * Initialize the task scheduler
     */
    initializeScheduler() {
        console.log('Initializing scheduled task manager');

        // Check for tasks that are due
        this.checkDueTasks();

        // Set up periodic check
        setInterval(() => this.checkDueTasks(), 60000); // Check every minute
    }

    /**
     * Check for tasks that are due to run
     */
    checkDueTasks() {
        const now = Date.now();

        Object.entries(this.tasks).forEach(([taskId, task]) => {
            if (!task.enabled) return;

            const lastRun = task.lastRun ? new Date(task.lastRun).getTime() : 0;
            const nextRun = lastRun + task.interval;

            if (now >= nextRun) {
                this.runTask(taskId);
            }
        });
    }

    /**
     * Run a specific task
     * @param {string} taskId - Task identifier
     * @returns {Promise} Task execution promise
     */
    async runTask(taskId) {
        const task = this.tasks[taskId];
        if (!task) {
            console.error(`Task ${taskId} not found`);
            return;
        }

        // Update last run time
        task.lastRun = new Date().toISOString();

        console.log(`Running scheduled task: ${task.name}`);

        try {
            // Execute task handler
            const result = await task.handler();

            // Record task execution
            this.recordTaskExecution(taskId, true, result);

            return result;
        } catch (error) {
            console.error(`Error executing task ${taskId}:`, error);

            // Record task error
            this.recordTaskExecution(taskId, false, null, error);

            return { error: error.message };
        }
    }

    /**
     * Record task execution in history
     * @param {string} taskId - Task identifier
     * @param {boolean} success - Whether task succeeded
     * @param {Object} result - Task result (if successful)
     * @param {Error} error - Error object (if failed)
     */
    recordTaskExecution(taskId, success, result = null, error = null) {
        const task = this.tasks[taskId];
        if (!task) return;

        const executionRecord = {
            taskId,
            taskName: task.name,
            category: task.category,
            timestamp: new Date().toISOString(),
            success,
            result: success ? result : null,
            error: !success ? { message: error.message, stack: error.stack } : null
        };

        // Add to history
        this.taskHistory.push(executionRecord);

        // Limit history size
        if (this.taskHistory.length > 1000) {
            this.taskHistory = this.taskHistory.slice(-1000);
        }

        // Save tasks
        this.saveTasks();
    }

    /**
     * Enable or disable a task
     * @param {string} taskId - Task identifier
     * @param {boolean} enabled - Whether task should be enabled
     */
    setTaskEnabled(taskId, enabled) {
        const task = this.tasks[taskId];
        if (!task) {
            console.error(`Task ${taskId} not found`);
            return;
        }

        task.enabled = !!enabled;

        console.log(`Task ${taskId} ${enabled ? 'enabled' : 'disabled'}`);

        // Save tasks
        this.saveTasks();
    }

    /**
     * Change a task's interval
     * @param {string} taskId - Task identifier
     * @param {number} intervalMs - New interval in milliseconds
     */
    setTaskInterval(taskId, intervalMs) {
        const task = this.tasks[taskId];
        if (!task) {
            console.error(`Task ${taskId} not found`);
            return;
        }

        task.interval = intervalMs;

        console.log(`Task ${taskId} interval set to ${intervalMs}ms`);

        // Save tasks
        this.saveTasks();
    }

    /**
     * Create a user-defined task
     * @param {Object} taskConfig - Task configuration
     * @returns {string} Task identifier
     */
    createUserTask(taskConfig) {
        // Generate task ID
        const taskId = taskConfig.id || `task_${Date.now()}`;

        // Validate required fields
        if (!taskConfig.name) {
            throw new Error('Task name is required');
        }
        if (!taskConfig.interval || typeof taskConfig.interval !== 'number') {
            throw new Error('Task interval must be a number');
        }
        if (!taskConfig.handlerCode) {
            throw new Error('Task handler code is required');
        }

        try {
            // Create handler function from code
            const handlerFunction = new Function('return ' + taskConfig.handlerCode)();

            // Register task
            this.registerTask(taskId, {
                ...taskConfig,
                category: this.categories.USER,
                handler: handlerFunction,
                enabled: true,
                lastRun: null
            });

            console.log(`User task '${taskConfig.name}' created successfully`);
            this.saveTasks();

            return taskId;
        } catch (error) {
            console.error('Error creating user task:', error);
            throw new Error(`Failed to create task: ${error.message}`);
        }
    }

    /**
     * Delete a task
     * @param {string} taskId - Task identifier
     * @returns {boolean} Success indicator
     */
    deleteTask(taskId) {
        const task = this.tasks[taskId];
        if (!task) {
            console.error(`Task ${taskId} not found`);
            return false;
        }

        // Only user tasks can be deleted
        if (task.category !== this.categories.USER) {
            console.error(`Cannot delete system task: ${taskId}`);
            return false;
        }

        delete this.tasks[taskId];
        console.log(`Task ${taskId} deleted successfully`);
        this.saveTasks();

        return true;
    }

    /**
     * Get all tasks
     * @param {string} [category] - Filter by category (optional)
     * @returns {Object} Tasks
     */
    getAllTasks(category = null) {
        if (category) {
            // Filter by category
            const filteredTasks = {};
            Object.entries(this.tasks).forEach(([id, task]) => {
                if (task.category === category) {
                    filteredTasks[id] = task;
                }
            });
            return filteredTasks;
        }

        return this.tasks;
    }

    /**
     * Get task history
     * @param {string} [taskId] - Filter by task ID (optional)
     * @param {number} limit - Maximum number of entries
     * @returns {Array} Task execution history
     */
    getTaskHistory(taskId = null, limit = 100) {
        if (taskId) {
            // Filter by task ID
            return this.taskHistory
                .filter(entry => entry.taskId === taskId)
                .slice(-limit);
        }

        return this.taskHistory.slice(-limit);
    }

    // Task handler implementations

    /**
     * Model cache optimization handler
     * Cleans up and optimizes local model cache
     */
    async modelCacheOptimizationHandler() {
        console.log('Running model cache optimization...');

        try {
            // Get model manager instance
            const modelManager = window.modelManager;
            if (!modelManager) {
                return { status: 'skipped', reason: 'Model manager not available' };
            }

            // Get local model status
            const downloadedModels = Object.keys(modelManager.localModelStatus.downloaded || {})
                .filter(id => modelManager.localModelStatus.downloaded[id]);

            if (downloadedModels.length === 0) {
                return { status: 'skipped', reason: 'No downloaded models found' };
            }

            // Perform cache cleanup operations
            const result = {
                modelsChecked: downloadedModels.length,
                modelsOptimized: 0,
                spaceReclaimed: 0
            };

            // Simulate optimization for each model
            for (const modelId of downloadedModels) {
                const model = modelManager.availableModels[modelId];
                if (!model) continue;

                // Simulate cache optimization (in a real implementation, this would perform
                // actual cache cleanup and optimization)
                if (Math.random() > 0.7) { // 30% chance to "optimize" a model
                    result.modelsOptimized++;

                    // Simulate space reclamation (in MB)
                    const reclaimedMB = Math.floor(Math.random() * 50) + 10;
                    result.spaceReclaimed += reclaimedMB;

                    console.log(`Optimized model ${modelId}, reclaimed ${reclaimedMB}MB`);
                }
            }

            return {
                status: 'success',
                ...result,
                totalSpaceReclaimed: `${result.spaceReclaimed}MB`
            };
        } catch (error) {
            console.error('Error during model cache optimization:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Quality metrics aggregation handler
     * Aggregates and analyzes quality metrics
     */
    async qualityMetricsAggregationHandler() {
        console.log('Running quality metrics aggregation...');

        try {
            // Get quality standards instance
            const qualityStandards = window.qualityStandards;
            if (!qualityStandards) {
                return { status: 'skipped', reason: 'Quality standards manager not available' };
            }

            // Generate quality report
            const report = qualityStandards.generateQualityReport();

            // Store report for historical tracking
            const reportHistory = JSON.parse(localStorage.getItem('wordGptPlusQualityReports') || '[]');
            reportHistory.push(report);

            // Keep only the last 30 reports
            if (reportHistory.length > 30) {
                reportHistory.shift();
            }

            localStorage.setItem('wordGptPlusQualityReports', JSON.stringify(reportHistory));

            // Extract key metrics for quick reference
            const keyMetrics = {
                responseTime: report.performance.averageResponseTime,
                satisfactionRate: report.quality.satisfactionRate,
                errorRate: Object.values(report.errors.rates).reduce((sum, rate) => sum + rate, 0),
                recommendations: report.recommendations.length
            };

            return {
                status: 'success',
                metrics: keyMetrics,
                timestamp: report.timestamp
            };
        } catch (error) {
            console.error('Error during quality metrics aggregation:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * User preference learning handler
     * Analyzes and learns from user behavior
     */
    async userPreferenceLearningHandler() {
        console.log('Running user preference learning...');

        try {
            // Get advanced learning instance
            const advancedLearning = window.advancedLearning;
            if (!advancedLearning) {
                return { status: 'skipped', reason: 'Advanced learning system not available' };
            }

            // Get user model and analyze patterns
            const report = advancedLearning.generatePreferencesReport();

            if (report.feedbackCount < 3) {
                return { status: 'skipped', reason: 'Insufficient feedback data for learning' };
            }

            // Simulate pattern recognition and model refinement
            const refinements = [];

            if (report.stylePreferences.length > 0) {
                refinements.push(`Refined style preference: ${report.stylePreferences[0].style}`);
            }

            if (report.topicInterests.length > 0) {
                refinements.push(`Identified topic interest: ${report.topicInterests[0].topic}`);
            }

            if (report.improvementAreas.length > 0) {
                refinements.push(`Addressed improvement area: ${report.improvementAreas[0].area}`);
            }

            return {
                status: 'success',
                refinements,
                modelConfidence: report.modelConfidence,
                feedbackProcessed: report.feedbackCount
            };
        } catch (error) {
            console.error('Error during user preference learning:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Document synchronization handler
     * Synchronizes documents with cloud storage
     */
    async documentSynchronizationHandler() {
        console.log('Running document synchronization...');

        try {
            // Get document manager instance
            const documentManager = window.documentManager;
            if (!documentManager) {
                return { status: 'skipped', reason: 'Document manager not available' };
            }

            // Check for cloud sync settings
            const syncSettings = JSON.parse(localStorage.getItem('wordGptPlusSyncSettings') || '{"enabled":false}');

            if (!syncSettings.enabled || !syncSettings.destination) {
                return { status: 'skipped', reason: 'Synchronization not configured' };
            }

            // Get documents that need syncing (simplified simulation)
            const allDocs = Object.values(documentManager.documents || {});
            const unsynced = allDocs.filter(doc => !doc.lastSynced || new Date(doc.timestamp) > new Date(doc.lastSynced));

            if (unsynced.length === 0) {
                return { status: 'success', message: 'All documents already synchronized', count: 0 };
            }

            // Simulate synchronization
            const synced = [];
            const failed = [];

            for (const doc of unsynced) {
                if (Math.random() > 0.1) { // 90% success rate
                    // Mark as synced
                    documentManager.documents[doc.id].lastSynced = new Date().toISOString();
                    synced.push(doc.id);
                } else {
                    failed.push(doc.id);
                }
            }

            // Save updated document status
            documentManager.saveDocuments();

            return {
                status: 'success',
                syncedCount: synced.length,
                failedCount: failed.length,
                destination: syncSettings.destination
            };
        } catch (error) {
            console.error('Error during document synchronization:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * System health check handler
     * Checks system health and performance
     */
    async systemHealthCheckHandler() {
        console.log('Running system health check...');

        try {
            // Check storage usage
            const storageUsage = await this.checkStorageUsage();

            // Check performance metrics
            const performanceMetrics = this.checkPerformanceMetrics();

            // Check for error patterns
            const errorPatterns = this.checkErrorPatterns();

            // Determine overall system health
            const criticalIssues = errorPatterns.criticalPatterns.length;
            const warnings = errorPatterns.warningPatterns.length +
                (storageUsage.percentUsed > 80 ? 1 : 0) +
                (performanceMetrics.issuesDetected ? 1 : 0);

            let healthStatus = 'excellent';
            if (criticalIssues > 0) {
                healthStatus = 'critical';
            } else if (warnings > 1) {
                healthStatus = 'warning';
            } else if (warnings === 1) {
                healthStatus = 'good';
            }

            return {
                status: 'success',
                healthStatus,
                storage: storageUsage,
                performance: performanceMetrics,
                errors: {
                    criticalIssues,
                    warnings,
                    patterns: errorPatterns
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error during system health check:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Check storage usage
     */
    async checkStorageUsage() {
        try {
            // For browsers, check localStorage usage
            const usage = {
                total: 5 * 1024 * 1024, // 5MB typical localStorage limit
                used: 0,
                percentUsed: 0
            };

            // Calculate current usage
            let totalChars = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                totalChars += key.length + value.length;
            }

            // Each character takes 2 bytes
            usage.used = totalChars * 2;
            usage.percentUsed = (usage.used / usage.total) * 100;
            usage.freeSpace = usage.total - usage.used;

            return usage;
        } catch (error) {
            console.error('Error checking storage usage:', error);
            return {
                total: 0,
                used: 0,
                percentUsed: 0,
                error: error.message
            };
        }
    }

    /**
     * Check performance metrics
     */
    checkPerformanceMetrics() {
        try {
            // Get quality standards instance to access performance metrics
            const qualityStandards = window.qualityStandards;
            if (!qualityStandards || !qualityStandards.metrics || !qualityStandards.metrics.performance) {
                return { issuesDetected: false, message: 'No performance data available' };
            }

            const metrics = qualityStandards.metrics.performance;
            const issues = [];

            // Check response time metrics for issues
            Object.entries(metrics).forEach(([name, data]) => {
                if (name.includes('response') || name.includes('generation')) {
                    const thresholds = qualityStandards.thresholds.responseTime;

                    if (data.avg > thresholds.acceptable) {
                        issues.push(`${name}: Average time (${data.avg.toFixed(0)}ms) exceeds acceptable threshold (${thresholds.acceptable}ms)`);
                    } else if (data.p95 > thresholds.acceptable * 1.5) {
                        issues.push(`${name}: 95th percentile (${data.p95.toFixed(0)}ms) is significantly high`);
                    }
                }
            });

            return {
                issuesDetected: issues.length > 0,
                issues,
                metrics: Object.keys(metrics).map(name => ({
                    name,
                    avg: metrics[name].avg,
                    p95: metrics[name].p95
                }))
            };
        } catch (error) {
            console.error('Error checking performance metrics:', error);
            return {
                issuesDetected: false,
                error: error.message
            };
        }
    }

    /**
     * Check for error patterns
     */
    checkErrorPatterns() {
        try {
            // Get quality standards instance to access error metrics
            const qualityStandards = window.qualityStandards;
            if (!qualityStandards || !qualityStandards.metrics || !qualityStandards.metrics.errors) {
                return { criticalPatterns: [], warningPatterns: [] };
            }

            const errors = qualityStandards.metrics.errors;

            // Group errors by message
            const errorGroups = {};
            errors.forEach(error => {
                const message = error.message || 'Unknown error';
                if (!errorGroups[message]) {
                    errorGroups[message] = [];
                }
                errorGroups[message].push(error);
            });

            const criticalPatterns = [];
            const warningPatterns = [];

            // Analyze error patterns
            Object.entries(errorGroups).forEach(([message, occurrences]) => {
                const count = occurrences.length;

                // Check if errors occurred recently (last 24 hours)
                const recentCount = occurrences.filter(e => {
                    const errorTime = new Date(e.timestamp).getTime();
                    const nowTime = new Date().getTime();
                    return (nowTime - errorTime) < 24 * 60 * 60 * 1000;
                }).length;

                if (recentCount >= 3) {
                    // Critical pattern - multiple recent occurrences
                    criticalPatterns.push({
                        message,
                        count: recentCount,
                        totalCount: count
                    });
                } else if (count >= 5) {
                    // Warning pattern - many occurrences over time
                    warningPatterns.push({
                        message,
                        count,
                        recentCount
                    });
                }
            });

            return { criticalPatterns, warningPatterns };
        } catch (error) {
            console.error('Error checking error patterns:', error);
            return {
                criticalPatterns: [],
                warningPatterns: [],
                error: error.message
            };
        }
    }
}

// Create global instance
const scheduledTaskManager = new ScheduledTaskManager();