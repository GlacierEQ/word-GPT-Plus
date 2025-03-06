/**
 * Word GPT Plus - System Initialization
 * Handles component loading, dependency resolution, and system startup
 */

class SystemInitializer {
    constructor() {
        // Component dependencies and loading order
        this.componentDependencies = {
            // Core systems - no dependencies
            'qualityStandards': [],
            'compressionUtils': [],
            'modelManager': [],
            'documentManager': [],

            // Second level - depends on core systems
            'intelligentFeatures': ['qualityStandards', 'modelManager'],
            'imageProcessor': ['documentManager'],
            'advancedLearning': ['qualityStandards'],
            'recursiveOptimizer': ['qualityStandards', 'modelManager'],

            // Integration level - depends on functionality systems
            'multiverseWriting': ['recursiveOptimizer', 'modelManager', 'advancedLearning'],
            'workflowManager': ['intelligentFeatures', 'recursiveOptimizer'],
            'scheduledTaskManager': ['modelManager', 'qualityStandards', 'documentManager'],

            // Top level - depends on everything
            'systemIntegration': ['*']
        };

        // Component loading status
        this.loadingStatus = {};

        // System state
        this.state = {
            initialized: false,
            startTime: Date.now(),
            loadErrors: [],
            componentsLoaded: 0,
            totalComponents: Object.keys(this.componentDependencies).length
        };
    }

    /**
     * Initialize the system
     */
    async initialize() {
        console.log('🚀 Initializing Word GPT Plus system...');
        performance.mark('system:init:start');

        try {
            // Check browser compatibility
            this.checkCompatibility();

            // Create loading status for tracking
            Object.keys(this.componentDependencies).forEach(component => {
                this.loadingStatus[component] = {
                    loaded: false,
                    error: null,
                    startTime: null,
                    endTime: null
                };
            });

            // Begin component loading sequence
            await this.loadComponentsInOrder();

            // Initialize UI after components are loaded
            if (window.systemIntegration) {
                console.log('Initializing system integration...');
                window.systemIntegration.initialize();
            } else {
                console.error('System integration component not available');
            }

            // Initialize scheduled tasks
            if (window.scheduledTaskManager) {
                console.log('Initializing scheduled tasks...');
                window.scheduledTaskManager.initializeScheduler();
            }

            // Record successful initialization
            this.state.initialized = true;
            performance.mark('system:init:end');
            performance.measure('system:initialization', 'system:init:start', 'system:init:end');

            const initTime = performance.getEntriesByName('system:initialization')[0].duration;
            console.log(`✅ System initialized in ${initTime.toFixed(2)}ms`);

            // Record startup quality metrics
            if (window.qualityStandards) {
                window.qualityStandards.recordPerformanceMetric('systemStartup', initTime);
            }

            return {
                success: true,
                initTime,
                componentsLoaded: this.state.componentsLoaded
            };
        } catch (error) {
            console.error('System initialization failed:', error);
            this.state.loadErrors.push({
                phase: 'initialization',
                error: error.message,
                stack: error.stack
            });

            this.displayInitError(error);

            return {
                success: false,
                error: error.message,
                componentsLoaded: this.state.componentsLoaded
            };
        }
    }

    /**
     * Check browser compatibility
     */
    checkCompatibility() {
        // Check for essential browser features
        const requiredFeatures = [
            { name: 'localStorage', test: () => typeof localStorage !== 'undefined' },
            { name: 'fetch', test: () => typeof fetch !== 'undefined' },
            { name: 'Promises', test: () => typeof Promise !== 'undefined' },
            {
                name: 'async/await', test: () => {
                    try {
                        eval('(async function() {})');
                        return true;
                    } catch (e) {
                        return false;
                    }
                }
            }
        ];

        const missingFeatures = requiredFeatures.filter(feature => !feature.test());

        if (missingFeatures.length > 0) {
            const missingFeatureNames = missingFeatures.map(f => f.name).join(', ');
            throw new Error(`Browser compatibility issue: Missing required features: ${missingFeatureNames}`);
        }
    }

    /**
     * Load components in dependency order
     */
    async loadComponentsInOrder() {
        // Create a workable copy of dependencies
        const pendingComponents = { ...this.componentDependencies };
        const loadedComponents = new Set();

        // Continue until all components are loaded
        while (Object.keys(pendingComponents).length > 0) {
            const loadableComponents = Object.entries(pendingComponents)
                .filter(([_, dependencies]) =>
                    dependencies.every(dep => dep === '*' || loadedComponents.has(dep))
                )
                .map(([component]) => component);

            if (loadableComponents.length === 0) {
                throw new Error('Circular dependency detected or missing component');
            }

            // Load components in parallel that are ready to be loaded
            await Promise.all(loadableComponents.map(component => this.loadComponent(component)));

            // Remove loaded components from pending
            loadableComponents.forEach(component => {
                loadedComponents.add(component);
                delete pendingComponents[component];
            });
        }

        console.log(`Loaded ${loadedComponents.size} components`);
    }

    /**
     * Load a specific component
     * @param {string} componentName - Component to load
     */
    async loadComponent(componentName) {
        console.log(`Loading component: ${componentName}`);
        this.loadingStatus[componentName].startTime = Date.now();

        try {
            // Check if component is already available in window
            if (window[componentName]) {
                console.log(`Component ${componentName} already available`);
                this.loadingStatus[componentName].loaded = true;
                this.loadingStatus[componentName].endTime = Date.now();
                this.state.componentsLoaded++;
                return;
            }

            // In a production environment, we would dynamically import the component
            // For this demonstration, we'll simulate the loading time
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));

            // Mark as loaded (in a real implementation, the component would be
            // assigned to window[componentName] during the import)
            this.loadingStatus[componentName].loaded = true;
            this.loadingStatus[componentName].endTime = Date.now();
            this.state.componentsLoaded++;

            console.log(`Component loaded: ${componentName}`);
        } catch (error) {
            console.error(`Failed to load component ${componentName}:`, error);
            this.loadingStatus[componentName].error = error.message;
            this.state.loadErrors.push({
                component: componentName,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Display initialization error to the user
     * @param {Error} error - Error object
     */
    displayInitError(error) {
        // Create error element if container exists
        const container = document.getElementById('word-gpt-plus-container');
        if (container) {
            const errorDisplay = document.createElement('div');
            errorDisplay.className = 'init-error';
            errorDisplay.style.padding = '20px';
            errorDisplay.style.backgroundColor = '#fde8e8';
            errorDisplay.style.border = '1px solid #f98080';
            errorDisplay.style.borderRadius = '4px';
            errorDisplay.style.margin = '20px 0';

            errorDisplay.innerHTML = `
                <h3 style="color:#e02424;margin-top:0">Initialization Error</h3>
                <p>${error.message}</p>
                <button id="retry-init-btn" style="padding:8px 16px;background:#e02424;color:white;border:none;border-radius:4px;cursor:pointer">
                    Retry Initialization
                </button>
            `;

            container.prepend(errorDisplay);

            // Add retry handler
            document.getElementById('retry-init-btn').addEventListener('click', () => {
                errorDisplay.remove();
                this.initialize();
            });
        } else {
            // Fallback to console
            console.error('Initialization error:', error);
        }
    }

    /**
     * Get loading status report
     * @returns {Object} Loading status report
     */
    getLoadingStatus() {
        const components = Object.entries(this.loadingStatus).map(([name, status]) => ({
            name,
            loaded: status.loaded,
            error: status.error,
            loadTime: status.endTime ? status.endTime - status.startTime : null
        }));

        return {
            initialized: this.state.initialized,
            componentsLoaded: this.state.componentsLoaded,
            totalComponents: this.state.totalComponents,
            loadErrors: this.state.loadErrors,
            components,
            totalTime: Date.now() - this.state.startTime
        };
    }

    /**
     * Check if all essential components are available
     * @returns {boolean} All essential components available
     */
    validateEssentialComponents() {
        const essentialComponents = [
            'qualityStandards',
            'modelManager',
            'systemIntegration'
        ];

        const missingComponents = essentialComponents.filter(
            component => !window[component]
        );

        if (missingComponents.length > 0) {
            console.error('Missing essential components:', missingComponents);
            return false;
        }

        return true;
    }
}

// Create instance and initialize
const systemInitializer = new SystemInitializer();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => systemInitializer.initialize());
} else {
    systemInitializer.initialize();
}
