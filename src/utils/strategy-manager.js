/**
 * Word GPT Plus - Strategy Manager
 * Manages optimization strategies for the recursive optimizer
 */

class StrategyManager {
    constructor() {
        // Initialize strategy registry
        this.strategies = {};

        // Strategy categories
        this.categories = {
            readability: [],
            accuracy: [],
            structure: [],
            code: [],
            specialized: []
        };

        // Strategy usage statistics
        this.usageStats = {};

        // Initialize success metrics
        this.successMetrics = {};
    }

    /**
     * Register a strategy
     * @param {Object} strategy - Strategy definition
     * @returns {boolean} Success indicator
     */
    registerStrategy(strategy) {
        // Validate strategy has required properties
        const requiredProps = ['id', 'name', 'category', 'applicabilityCheck', 'optimize'];
        const missingProps = requiredProps.filter(prop => !strategy[prop]);

        if (missingProps.length > 0) {
            console.error(`Strategy missing required properties: ${missingProps.join(', ')}`);
            return false;
        }

        // Store strategy
        this.strategies[strategy.id] = {
            ...strategy,
            enabled: true,
            lastModified: new Date().toISOString()
        };

        // Add to category
        if (this.categories[strategy.category]) {
            this.categories[strategy.category].push(strategy.id);
        } else {
            this.categories.specialized.push(strategy.id);
        }

        // Initialize usage statistics
        this.usageStats[strategy.id] = {
            uses: 0,
            successes: 0,
            failures: 0,
            avgImprovementPercent: 0,
            avgProcessingTime: 0
        };

        return true;
    }

    /**
     * Get all available strategies
     * @returns {Array} Array of strategy objects
     */
    getAllStrategies() {
        return Object.values(this.strategies);
    }

    /**
     * Get strategies by category
     * @param {string} category - Strategy category
     * @returns {Array} Array of strategy objects in the category
     */
    getStrategiesByCategory(category) {
        if (!this.categories[category]) return [];

        return this.categories[category]
            .map(id => this.strategies[id])
            .filter(strategy => strategy && strategy.enabled);
    }

    /**
     * Get the most suitable strategies for content
     * @param {string} content - Content to analyze
     * @param {Object} metadata - Additional metadata
     * @param {number} limit - Maximum number of strategies to return
     * @returns {Array} Array of suitable strategies
     */
    getSuitableStrategies(content, metadata = {}, limit = 3) {
        // Filter strategies by applicability
        const applicableStrategies = Object.values(this.strategies)
            .filter(strategy => strategy.enabled && strategy.applicabilityCheck(content, metadata))
            .map(strategy => {
                // Calculate suitability score
                const baseScore = strategy.priority || 50;
