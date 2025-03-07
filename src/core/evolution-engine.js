/**
 * Word GPT Plus - Evolution Engine
 * 
 * Manages progressive improvement and adaptation of AI capabilities based on:
 * - User interactions
 * - Document context patterns
 * - Quality feedback loops
 */

class EvolutionEngine {
    constructor() {
        // Evolution parameters
        this.parameters = {
            learningRate: 0.3,        // How quickly system adapts to user preferences
            explorationRate: 0.2,     // Probability of trying alternative approaches
            qualityThreshold: 0.75,   // Minimum quality score to reinforce behaviors
            adaptationDecay: 0.95,    // Rate at which adaptations fade without reinforcement
        };

        // Learning models
        this.models = {
            userPreferences: {
                style: {},            // Writing style preferences
                formatting: {},       // Document formatting preferences
                vocabulary: {},       // Word choice preferences
                complexity: null,     // Preferred complexity level
            },
            documentContext: {
                patterns: {},         // Recognized document patterns
                conventions: {},      // Document-specific conventions
            },
            generationStrategies: [], // Successful generation strategies
        };

        // Performance and quality metrics
        this.metrics = {
            qualityScores: [],
            userSatisfaction: [],
            effectivenessRatings: [],
        };

        // Strategy selection history for reinforcement learning
        this.strategyHistory = [];

        // Adaptation state
        this.adaptationState = {
            initialized: false,
            lastUpdated: null,
            adaptationLevel: 0,
            confidenceScore: 0.5,
        };
    }

    /**
     * Initialize the evolution engine
     */
    initialize() {
        console.log('Initializing Evolution Engine...');

        // Load any saved learning state
        this.loadLearningState();

        // Initialize learning models if new
        if (!this.adaptationState.initialized) {
            this.initializeModels();
        }

        // Set initialization state
        this.adaptationState.initialized = true;
        this.adaptationState.lastUpdated = new Date();

        console.log('Evolution Engine initialized');
    }

    /**
     * Initialize baseline learning models
     * @private
     */
    initializeModels() {
        // Set baseline user preferences
        this.models.userPreferences.complexity = 0.5;  // Medium complexity

        // Initialize default generation strategies
        this.models.generationStrategies = [
            {
                id: 'standard',
                name: 'Balanced Approach',
                parameters: { temperature: 0.7, topP: 0.9 },
                successRate: 0.5,
                situations: ['general']
            },
            {
                id: 'creative',
                name: 'Creative Writing',
                parameters: { temperature: 0.9, topP: 0.95 },
                successRate: 0.5,
                situations: ['creative', 'informal']
            },
            {
                id: 'precise',
                name: 'Precise Communication',
                parameters: { temperature: 0.3, topP: 0.8 },
                successRate: 0.5,
                situations: ['technical', 'formal']
            }
        ];
    }

    /**
     * Load previously saved learning state
     * @private
     */
    loadLearningState() {
        try {
            // Attempt to load from local storage
            const savedState = localStorage.getItem('wordGptPlusEvolution');
            if (savedState) {
                const parsedState = JSON.parse(savedState);

                // Merge saved state with default properties
                this.models.userPreferences = {
                    ...this.models.userPreferences,
                    ...parsedState.userPreferences
                };

                this.models.documentContext = {
                    ...this.models.documentContext,
                    ...parsedState.documentContext
                };

                if (parsedState.generationStrategies) {
                    this.models.generationStrategies = parsedState.generationStrategies;
                }

                this.adaptationState = {
                    ...this.adaptationState,
                    ...parsedState.adaptationState
                };

                console.log('Loaded evolution state from storage');
            }
        } catch (error) {
            console.error('Error loading evolution state:', error);
            // Continue with default state
        }
    }

    /**
     * Save current learning state
     * @private
     */
    saveLearningState() {
        try {
            const stateToSave = {
                userPreferences: this.models.userPreferences,
                documentContext: this.models.documentContext,
                generationStrategies: this.models.generationStrategies,
                adaptationState: this.adaptationState
            };

            localStorage.setItem('wordGptPlusEvolution', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving evolution state:', error);
        }
    }

    /**
     * Select optimal generation strategy for current context
     * @param {Object} context - Document and request context
     * @returns {Object} Selected strategy with parameters
     */
    selectStrategy(context) {
        // Default to standard strategy
        let selectedStrategy = this.models.generationStrategies.find(s => s.id === 'standard');

        // If we have enough context, make an informed selection
        if (context) {
            // Determine document type
            const documentType = this.detectDocumentType(context);

            // Find strategies that match the document type
            const matchingStrategies = this.models.generationStrategies.filter(
                strategy => strategy.situations.includes(documentType)
            );

            if (matchingStrategies.length > 0) {
                // Sort by success rate
                matchingStrategies.sort((a, b) => b.successRate - a.successRate);

                // Sometimes explore other strategies based on exploration rate
                if (Math.random() > this.parameters.explorationRate) {
                    selectedStrategy = matchingStrategies[0]; // Best strategy
                } else {
                    // Randomly select from top 3 or all if fewer
                    const topCount = Math.min(3, matchingStrategies.length);
                    const index = Math.floor(Math.random() * topCount);
                    selectedStrategy = matchingStrategies[index];
                }
            }
        }

        // Record the selected strategy for later learning
        this.strategyHistory.push({
            strategy: selectedStrategy.id,
            context: { ...context },
            timestamp: Date.now()
        });

        // Return a copy of the strategy with any user preference adjustments
        return {
            ...selectedStrategy,
            parameters: { ...selectedStrategy.parameters }
        };
    }

    /**
     * Detect document type from context
     * @param {Object} context - Document context
     * @returns {string} Document type identifier
     * @private
     */
    detectDocumentType(context) {
        // Extract relevant features from context
        const features = this.extractContextFeatures(context);

        // Match features to document types
        if (features.formalLanguage > 0.7) {
            if (features.technicalTerms > 0.5) return 'technical';
            if (features.legalTerms > 0.3) return 'legal';
            return 'formal';
        } else if (features.creativeLanguage > 0.6) {
            return 'creative';
        } else if (features.conversational > 0.7) {
            return 'informal';
        }

        // Default type
        return 'general';
    }

    /**
     * Extract context features for analysis
     * @param {Object} context - Document context
     * @returns {Object} Extracted features
     * @private 
     */
    extractContextFeatures(context) {
        // This would implement text analysis to extract features
        // For now, return simplified mock features
        return {
            formalLanguage: context.formality || 0.5,
            creativeLanguage: context.creativity || 0.3,
            conversational: context.conversational || 0.3,
            technicalTerms: context.technical || 0.2,
            legalTerms: context.legal || 0.1
        };
    }

    /**
     * Process feedback on generation results
     * @param {Object} feedback - User or system feedback
     * @param {string} feedback.strategyId - ID of strategy used
     * @param {number} feedback.qualityScore - Quality rating (0-1)
     * @param {boolean} feedback.userAccepted - Whether user accepted the result
     */
    processFeedback(feedback) {
        // Find the strategy used
        const strategyIndex = this.models.generationStrategies.findIndex(
            s => s.id === feedback.strategyId
        );

        if (strategyIndex === -1) return;

        // Get the strategy
        const strategy = this.models.generationStrategies[strategyIndex];

        // Update success rate with new information (weighted average)
        const oldWeight = 0.7;  // Weight for historical data
        const newWeight = 0.3;  // Weight for new data

        // Calculate new success rate
        const successIndicator = feedback.qualityScore > this.parameters.qualityThreshold ? 1 : 0;
        strategy.successRate = (strategy.successRate * oldWeight) + (successIndicator * newWeight);

        // Update the strategy in our collection
        this.models.generationStrategies[strategyIndex] = strategy;

        // Add to metrics history
        this.metrics.qualityScores.push({
            strategyId: feedback.strategyId,
            score: feedback.qualityScore,
            timestamp: Date.now()
        });

        // Track user satisfaction
        if (typeof feedback.userAccepted === 'boolean') {
            this.metrics.userSatisfaction.push({
                strategyId: feedback.strategyId,
                satisfied: feedback.userAccepted,
                timestamp: Date.now()
            });
        }

        // Update adaptation level
        this.adaptationState.adaptationLevel += 0.01;
        this.adaptationState.lastUpdated = new Date();

        // Periodically prune old metrics
        this.pruneOldMetrics();

        // Save state after significant changes
        this.saveLearningState();
    }

    /**
     * Prune old metrics to avoid excessive memory use
     * @private
     */
    pruneOldMetrics() {
        const now = Date.now();
        const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

        // Keep only recent metrics
        this.metrics.qualityScores = this.metrics.qualityScores
            .filter(item => item.timestamp >= oneMonthAgo);

        this.metrics.userSatisfaction = this.metrics.userSatisfaction
            .filter(item => item.timestamp >= oneMonthAgo);
    }

    /**
     * Learn from document context
     * @param {Object} document - Document data
     */
    learnFromDocument(document) {
        if (!document || !document.text) return;

        // This would implement document analysis and pattern recognition
        // For a simple implementation, we'll just track some basic patterns

        try {
            // Extract document structure patterns
            const patterns = this.analyzeDocumentPatterns(document);

            // Update our document context models
            Object.keys(patterns).forEach(key => {
                // Initialize if needed
                if (!this.models.documentContext.patterns[key]) {
                    this.models.documentContext.patterns[key] = {
                        value: patterns[key],
                        occurrences: 1
                    };
                } else {
                    // Update existing pattern
                    const existing = this.models.documentContext.patterns[key];
                    existing.value = (existing.value * existing.occurrences + patterns[key]) /
                        (existing.occurrences + 1);
                    existing.occurrences += 1;
                }
            });

            // Save updated state
            this.adaptationState.lastUpdated = new Date();
            this.saveLearningState();
        } catch (error) {
            console.error('Error learning from document:', error);
        }
    }

    /**
     * Analyze document for patterns
     * @param {Object} document - Document data
     * @returns {Object} Extracted patterns
     * @private
     */
    analyzeDocumentPatterns(document) {
        // This would be a more sophisticated analysis in a real implementation
        return {
            averageSentenceLength: this.calculateAverageSentenceLength(document.text),
            formalityScore: this.calculateFormality(document.text),
            complexityScore: this.calculateComplexity(document.text)
        };
    }

    /**
     * Calculate average sentence length
     * @param {string} text - Document text
     * @returns {number} Average sentence length
     * @private
     */
    calculateAverageSentenceLength(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length === 0) return 0;

        const totalWords = sentences.reduce((count, sentence) => {
            return count + sentence.trim().split(/\s+/).length;
        }, 0);

        return totalWords / sentences.length;
    }

    /**
     * Calculate text formality
     * @param {string} text - Document text
     * @returns {number} Formality score (0-1)
     * @private
     */
    calculateFormality(text) {
        // Simple formality heuristics
        const formalIndicators = [
            'therefore', 'consequently', 'furthermore', 'thus', 'hence',
            'regarding', 'concerning', 'whereby', 'indeed', 'moreover'
        ];

        const informalIndicators = [
            'like', 'so', 'pretty', 'kind of', 'sort of', 'just',
            'basically', 'actually', 'really', 'totally'
        ];

        const lowerText = text.toLowerCase();
        let formalCount = 0;
        let informalCount = 0;

        formalIndicators.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            const matches = lowerText.match(regex);
            if (matches) formalCount += matches.length;
        });

        informalIndicators.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            const matches = lowerText.match(regex);
            if (matches) informalCount += matches.length;
        });

        const total = formalCount + informalCount;
        if (total === 0) return 0.5; // Neutral default

        return formalCount / total;
    }

    /**
     * Calculate text complexity
     * @param {string} text - Document text
     * @returns {number} Complexity score (0-1)
     * @private
     */
    calculateComplexity(text) {
        // Simple complexity heuristics based on word length and sentence length
        const words = text.split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return 0.5;

        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = sentences.length === 0 ? 0 : words.length / sentences.length;

        // Normalize to 0-1 range
        const wordLengthScore = Math.min(1, avgWordLength / 8);  // 8+ char words -> 1.0
        const sentenceLengthScore = Math.min(1, avgSentenceLength / 25);  // 25+ words -> 1.0

        return (wordLengthScore * 0.5) + (sentenceLengthScore * 0.5);
    }

    /**
     * Generate report on adaptation and learning
     * @returns {Object} Adaptation report
     */
    generateAdaptationReport() {
        // Calculate metrics
        const totalFeedback = this.metrics.qualityScores.length;
        const averageQuality = this.metrics.qualityScores.length > 0 ?
            this.metrics.qualityScores.reduce((sum, item) => sum + item.score, 0) /
            this.metrics.qualityScores.length : 0;

        const userSatisfactionRate = this.metrics.userSatisfaction.length > 0 ?
            this.metrics.userSatisfaction.filter(item => item.satisfied).length /
            this.metrics.userSatisfaction.length : 0;

        // Find most successful strategies
        const strategies = [...this.models.generationStrategies]
            .sort((a, b) => b.successRate - a.successRate);

        return {
            adaptationLevel: this.adaptationState.adaptationLevel,
            lastUpdated: this.adaptationState.lastUpdated,
            totalFeedbackReceived: totalFeedback,
            averageQualityScore: averageQuality,
            userSatisfactionRate: userSatisfactionRate,
            topStrategies: strategies.slice(0, 3).map(s => ({
                id: s.id,
                name: s.name,
                successRate: s.successRate
            })),
            learnedPatterns: Object.keys(this.models.documentContext.patterns)
                .map(key => ({
                    pattern: key,
                    value: this.models.documentContext.patterns[key].value,
                    occurrences: this.models.documentContext.patterns[key].occurrences
                }))
        };
    }

    /**
     * Create a new generation strategy
     * @param {Object} strategyData - Strategy definition
     * @returns {boolean} Success status
     */
    createStrategy(strategyData) {
        if (!strategyData.id || !strategyData.name || !strategyData.parameters) {
            return false;
        }

        // Check for duplicate ID
        if (this.models.generationStrategies.some(s => s.id === strategyData.id)) {
            return false;
        }

        // Create new strategy with defaults for missing properties
        const newStrategy = {
            id: strategyData.id,
            name: strategyData.name,
            parameters: strategyData.parameters,
            successRate: 0.5, // Start with neutral success rate
            situations: strategyData.situations || ['general']
        };

        // Add to strategies collection
        this.models.generationStrategies.push(newStrategy);

        // Save state
        this.saveLearningState();

        return true;
    }
}

// Create global instance
const evolutionEngine = new EvolutionEngine();
