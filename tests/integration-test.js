/**
 * Word GPT Plus - Integration Test Harness
 * Verifies all components work together properly
 */

class IntegrationTestHarness {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0
        };
        this.currentTest = null;
    }

    /**
     * Register a test case
     * @param {string} name - Test name
     * @param {Function} testFn - Test function
     * @param {Object} options - Test options
     */
    registerTest(name, testFn, options = {}) {
        this.tests.push({
            name,
            fn: testFn,
            dependencies: options.dependencies || [],
            timeout: options.timeout || 5000,
            skip: options.skip || false
        });
    }

    /**
     * Run all registered tests
     */
    async runAllTests() {
        console.log('🧪 Starting Word GPT Plus integration tests...');

        const startTime = performance.now();
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: this.tests.length,
            details: []
        };

        // Check system initialization first
        const initResult = await this.checkSystemInitialization();
        if (!initResult.success) {
            console.error('❌ System initialization failed, cannot run tests.');
            console.error(`Error: ${initResult.error}`);
            return {
                ...this.results,
                systemInitialized: false,
                error: initResult.error
            };
        }

        // Run each test
        for (const test of this.tests) {
            this.currentTest = test;

            // Check if test should be skipped
            if (test.skip) {
                console.log(`⏭️ Skipping test: ${test.name}`);
                this.results.skipped++;
                this.results.details.push({
                    name: test.name,
                    status: 'skipped',
                    duration: 0
                });
                continue;
            }

            // Check dependencies
            const missingDeps = this.checkDependencies(test.dependencies);
            if (missingDeps.length > 0) {
                console.log(`⏭️ Skipping test "${test.name}": Missing dependencies: ${missingDeps.join(', ')}`);
                this.results.skipped++;
                this.results.details.push({
                    name: test.name,
                    status: 'skipped',
                    reason: `Missing dependencies: ${missingDeps.join(', ')}`,
                    duration: 0
                });
                continue;
            }

            // Run the test
            console.log(`🔍 Running test: ${test.name}`);
            const testStartTime = performance.now();

            try {
                // Create test timeout
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Test timed out after ${test.timeout}ms`)), test.timeout);
                });

                // Run test with timeout
                const result = await Promise.race([
                    test.fn(),
                    timeoutPromise
                ]);

                const duration = performance.now() - testStartTime;
                console.log(`✅ Test passed: ${test.name} (${duration.toFixed(2)}ms)`);

                this.results.passed++;
                this.results.details.push({
                    name: test.name,
                    status: 'passed',
                    duration,
                    result
                });
            } catch (error) {
                const duration = performance.now() - testStartTime;
                console.error(`❌ Test failed: ${test.name}`);
                console.error(error);

                this.results.failed++;
                this.results.details.push({
                    name: test.name,
                    status: 'failed',
                    duration,
                    error: {
                        message: error.message,
                        stack: error.stack
                    }
                });
            }
        }

        // Finalize results
        const totalDuration = performance.now() - startTime;
        this.results.duration = totalDuration;

        // Log summary
        this.logSummary();

        return this.results;
    }

    /**
     * Check system initialization
     * @returns {Object} Init check result
     */
    async checkSystemInitialization() {
        console.log('Checking system initialization...');

        try {
            // Check if system initializer exists
            if (!window.systemInitializer) {
                return {
                    success: false,
                    error: 'System initializer not found'
                };
            }

            // Check essential components
            const missingComponents = [];

            // List of required components
            const requiredComponents = [
                'qualityStandards',
                'modelManager',
                'systemIntegration'
            ];

            // Check each component
            requiredComponents.forEach(component => {
                if (!window[component]) {
                    missingComponents.push(component);
                }
            });

            if (missingComponents.length > 0) {
                return {
                    success: false,
                    error: `Missing required components: ${missingComponents.join(', ')}`
                };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check test dependencies
     * @param {Array} dependencies - List of required dependencies
     * @returns {Array} Missing dependencies
     */
    checkDependencies(dependencies) {
        const missing = [];

        for (const dep of dependencies) {
            let isDependencySatisfied = false;

            // Check if dependency is a component
            if (window[dep]) {
                isDependencySatisfied = true;
            }

            // Check if dependency is a previous passing test
            if (!isDependencySatisfied && this.results.details) {
                isDependencySatisfied = this.results.details.some(
                    detail => detail.name === dep && detail.status === 'passed'
                );
            }

            if (!isDependencySatisfied) {
                missing.push(dep);
            }
        }

        return missing;
    }

    /**
     * Log test summary to console
     */
    logSummary() {
        console.log('\n==== TEST SUMMARY ====');
        console.log(`Total tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⏭️ Skipped: ${this.results.skipped}`);
        console.log(`Duration: ${this.results.duration.toFixed(2)}ms`);

        if (this.results.failed > 0) {
            console.log('\n==== FAILURES ====');
            this.results.details
                .filter(detail => detail.status === 'failed')
                .forEach(failure => {
                    console.log(`❌ ${failure.name}: ${failure.error.message}`);
                });
        }

        console.log('\n====================');
    }
}

// Create test harness and register tests
const testHarness = new IntegrationTestHarness();

// Test 1: System initialization
testHarness.registerTest(
    'System initialization',
    async () => {
        // Check if all essential components are loaded
        if (!window.systemInitializer) {
            throw new Error('System initializer not available');
        }

        // Check loading status
        const status = window.systemInitializer.getLoadingStatus();

        if (status.loadErrors.length > 0) {
            throw new Error(`System initialization had errors: ${status.loadErrors[0].error}`);
        }

        if (status.componentsLoaded < status.totalComponents) {
            throw new Error(`Not all components loaded: ${status.componentsLoaded}/${status.totalComponents}`);
        }

        return true;
    }
);

// Test 2: Model manager functionality
testHarness.registerTest(
    'Model manager functionality',
    async () => {
        if (!window.modelManager) {
            throw new Error('Model manager not available');
        }

        // Test getting available models
        const models = window.modelManager.getAvailableModels();
        if (!models || Object.keys(models).length === 0) {
            throw new Error('No models available');
        }

        // Get active model
        const activeModel = window.modelManager.activeModel;
        if (!activeModel) {
            throw new Error('No active model set');
        }

        // Ensure active model exists in available models
        if (!models[activeModel]) {
            throw new Error(`Active model ${activeModel} not found in available models`);
        }

        return true;
    },
    { dependencies: ['System initialization'] }
);

// Test 3: Quality standards functionality
testHarness.registerTest(
    'Quality standards functionality',
    async () => {
        if (!window.qualityStandards) {
            throw new Error('Quality standards not available');
        }

        // Test recording a performance metric
        window.qualityStandards.recordPerformanceMetric('test-metric', 100);

        // Verify it was recorded
        const performanceMetrics = window.qualityStandards.metrics.performance;
        if (!performanceMetrics['test-metric']) {
            throw new Error('Failed to record performance metric');
        }

        // Test generating a quality report
        const report = window.qualityStandards.generateQualityReport();
        if (!report || !report.timestamp) {
            throw new Error('Failed to generate quality report');
        }

        return true;
    },
    { dependencies: ['System initialization'] }
);

// Test 4: Text generation
testHarness.registerTest(
    'Text generation',
    async () => {
        if (!window.modelManager) {
            throw new Error('Model manager not available');
        }

        // Test generating text
        const prompt = "Write a short paragraph about artificial intelligence.";
        const response = await window.modelManager.generateText(prompt);

        if (!response || typeof response !== 'string' || response.length < 10) {
            throw new Error('Generated text is invalid or too short');
        }

        return true;
    },
    { dependencies: ['Model manager functionality'], timeout: 10000 }
);

// Test 5: Workflow functionality
testHarness.registerTest(
    'Workflow functionality',
    async () => {
        if (!window.workflowManager) {
            throw new Error('Workflow manager not available');
        }

        // Register a test handler
        window.workflowManager.registerHandler('testHandler', async (inputs) => {
            return { testOutput: 'Test output: ' + (inputs.testInput || 'no input') };
        });

        // Create a test workflow
        const workflowId = window.workflowManager.createWorkflow('documentImprovement');
        if (!workflowId) {
            throw new Error('Failed to create workflow');
        }

        // Set test data
        window.workflowManager.setWorkflowData(workflowId, {
            documentText: "This is a test document."
        });

        // Start the workflow but don't wait for completion as it might require user approval
        const result = await window.workflowManager.startWorkflow(workflowId);

        // Just check that the workflow started
        if (!result || !['running', 'awaiting_approval'].includes(result.status)) {
            throw new Error(`Workflow failed to start properly: ${JSON.stringify(result)}`);
        }

        return true;
    },
    { dependencies: ['System initialization'] }
);

// Test 6: Scheduled tasks
testHarness.registerTest(
    'Scheduled tasks',
    async () => {
        if (!window.scheduledTaskManager) {
            throw new Error('Scheduled task manager not available');
        }

        // Get all tasks
        const tasks = window.scheduledTaskManager.getAllTasks();
        if (!tasks || Object.keys(tasks).length === 0) {
            throw new Error('No scheduled tasks available');
        }

        // Try to run a task manually
        const taskId = Object.keys(tasks)[0];
        const result = await window.scheduledTaskManager.runTask(taskId);

        // Check if the task execution was recorded in history
        const history = window.scheduledTaskManager.getTaskHistory(taskId, 1);
        if (history.length === 0) {
            throw new Error('Task execution not recorded in history');
        }

        return true;
    },
    { dependencies: ['System initialization'] }
);

// Test 7: Analytics dashboard
testHarness.registerTest(
    'Analytics dashboard',
    async () => {
        if (!window.analyticsDashboard) {
            throw new Error('Analytics dashboard not available');
        }

        // Create a test container for the dashboard
        const container = document.createElement('div');
        container.id = 'test-dashboard-container';
        document.body.appendChild(container);

        try {
            // Initialize the dashboard
            window.analyticsDashboard.initialize(container);

            // Check if dashboard elements were created
            const metricsElements = container.querySelectorAll('.metric-value');
            if (metricsElements.length === 0) {
                throw new Error('Dashboard metrics not rendered');
            }

            return true;
        } finally {
            // Clean up test container
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
    },
    { dependencies: ['System initialization'] }
);

// Run tests when page is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit to ensure all components are loaded
    setTimeout(async () => {
        const results = await testHarness.runAllTests();

        // Emit event with test results
        const event = new CustomEvent('word-gpt-plus-tests-completed', { detail: results });
        document.dispatchEvent(event);

        // Store results for later access
        window.wordGptPlusTestResults = results;
    }, 1000);
});
