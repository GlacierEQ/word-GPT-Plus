/**
 * Word GPT Plus - Multiverse Writing
 * Generates parallel content versions across different writing dimensions
 * and allows visualization and merging of alternate text possibilities
 */

class MultiverseWriting {
    constructor() {
        // Multiverse configurations
        this.dimensions = {
            FORMAL: 'formal',
            CREATIVE: 'creative',
            TECHNICAL: 'technical',
            PERSUASIVE: 'persuasive',
            CONCISE: 'concise',
            ELABORATE: 'elaborate',
            FUTURE: 'future',      // Futuristic language/concepts
            CLASSIC: 'classic'     // Classical/traditional style
        };

        // Tracking active universes
        this.activeUniverses = {};
        this.universeHistory = [];
        this.selectedUniverse = null;

        // Universe metadata tracking
        this.universeMetadata = {};

        // Configuration options
        this.config = {
            maxUniverses: 5,                  // Maximum parallel universes to maintain
            interdimensionalBlending: true,   // Allow merging content across universes
            temporalPersistence: true,        // Remember universes between sessions
            quantumUncertainty: 0.2,          // Randomness factor (0-1)
            dimensionalResonance: true        // Match tone/style across universes
        };

        // Load previous multiverse state
        this.loadState();

        // Initialize visualization components
        this.visualComponents = {
            universeMap: null,
            comparisionView: null,
            mergeControls: null
        };

        // Universe colors for visualization
        this.universeColors = {
            [this.dimensions.FORMAL]: '#3b5dc9',
            [this.dimensions.CREATIVE]: '#9c27b0',
            [this.dimensions.TECHNICAL]: '#0288d1',
            [this.dimensions.PERSUASIVE]: '#d32f2f',
            [this.dimensions.CONCISE]: '#388e3c',
            [this.dimensions.ELABORATE]: '#fb8c00',
            [this.dimensions.FUTURE]: '#00bcd4',
            [this.dimensions.CLASSIC]: '#795548'
        };

        // Interdimensional bridges (optimal combinations)
        this.dimensionalBridges = [
            { source: this.dimensions.FORMAL, target: this.dimensions.TECHNICAL, strength: 0.8 },
            { source: this.dimensions.CREATIVE, target: this.dimensions.ELABORATE, strength: 0.9 },
            { source: this.dimensions.CONCISE, target: this.dimensions.TECHNICAL, strength: 0.7 },
            { source: this.dimensions.PERSUASIVE, target: this.dimensions.ELABORATE, strength: 0.75 },
            { source: this.dimensions.FUTURE, target: this.dimensions.CREATIVE, strength: 0.85 },
            { source: this.dimensions.CLASSIC, target: this.dimensions.FORMAL, strength: 0.8 }
        ];

        // Initialize the event system
        this.events = {
            onUniverseCreated: null,
            onUniverseSelected: null,
            onUniversesMerged: null,
            onVisualizationReady: null
        };
    }

    /**
     * Load previous multiverse state from storage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('wordGptPlusMultiverse');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.activeUniverses = state.activeUniverses || {};
                this.universeHistory = state.universeHistory || [];
                this.universeMetadata = state.universeMetadata || {};
                this.config = { ...this.config, ...state.config };
                console.log('Multiverse state loaded successfully');
            }
        } catch (error) {
            console.error('Error loading multiverse state:', error);
        }
    }

    /**
     * Save current multiverse state to storage
     */
    saveState() {
        try {
            const state = {
                activeUniverses: this.activeUniverses,
                universeHistory: this.universeHistory.slice(-20), // Limit history
                universeMetadata: this.universeMetadata,
                config: this.config
            };
            localStorage.setItem('wordGptPlusMultiverse', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving multiverse state:', error);
        }
    }

    /**
     * Generate multiple content versions across different dimensions
     * @param {string} prompt - Original user prompt
     * @param {string} baseContent - Original content (if any)
     * @param {string[]} dimensions - Dimensions to explore (defaults to 3 random dimensions)
     * @returns {Promise<Object>} Generated universes
     */
    async generateUniverses(prompt, baseContent = '', dimensions = null) {
        // Choose dimensions if not specified
        if (!dimensions || dimensions.length === 0) {
            dimensions = this.getRandomDimensions(3);
        }

        // Limit to max universes
        const dimensionsToUse = dimensions.slice(0, this.config.maxUniverses);

        // Generate universe ID to group these variations
        const universeGroupId = `mv_${Date.now()}`;
        const results = {};

        // Process each dimension
        for (const dimension of dimensionsToUse) {
            // Create universe ID
            const universeId = `${universeGroupId}_${dimension}`;

            // Create dimension-specific prompt
            const enhancedPrompt = this.enhancePromptForDimension(prompt, dimension);

            try {
                // In a real implementation, we would call the AI service
                // For now, we'll simulate the response
                const content = await this.simulateContentGeneration(enhancedPrompt, baseContent, dimension);

                // Store the universe
                this.activeUniverses[universeId] = {
                    id: universeId,
                    groupId: universeGroupId,
                    dimension,
                    content,
                    prompt: enhancedPrompt,
                    originalPrompt: prompt,
                    timestamp: new Date().toISOString()
                };

                // Add metadata
                this.universeMetadata[universeId] = {
                    dimension,
                    creationTime: Date.now(),
                    viewCount: 0,
                    mergeCount: 0,
                    characteristics: this.analyzeUniverseCharacteristics(content, dimension)
                };

                // Add to results
                results[universeId] = this.activeUniverses[universeId];
            } catch (error) {
                console.error(`Error generating universe for dimension ${dimension}:`, error);
            }
        }

        // Add to history
        this.universeHistory.push({
            groupId: universeGroupId,
            prompt,
            dimensions: dimensionsToUse,
            timestamp: new Date().toISOString(),
            universeIds: Object.keys(results)
        });

        // Save state
        this.saveState();

        // Trigger event
        if (this.events.onUniverseCreated) {
            this.events.onUniverseCreated(results);
        }

        return results;
    }

    /**
     * Get random dimensions for exploration
     * @param {number} count - Number of dimensions to select
     * @returns {string[]} Selected dimensions
     */
    getRandomDimensions(count) {
        const allDimensions = Object.values(this.dimensions);
        const shuffled = allDimensions.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Enhance prompt for a specific dimension
     * @param {string} prompt - Original prompt
     * @param {string} dimension - Target dimension
     * @returns {string} Enhanced prompt
     */
    enhancePromptForDimension(prompt, dimension) {
        let dimensionInstruction = '';

        switch (dimension) {
            case this.dimensions.FORMAL:
                dimensionInstruction = 'Use formal, professional language appropriate for academic or business contexts. Use precise vocabulary, proper grammar, and avoid contractions or colloquialisms.';
                break;
            case this.dimensions.CREATIVE:
                dimensionInstruction = 'Use creative, imaginative language rich with metaphors, vivid descriptions, and unexpected connections. Feel free to be original and evocative.';
                break;
            case this.dimensions.TECHNICAL:
                dimensionInstruction = 'Use technical, precise language with domain-specific terminology. Prioritize accuracy, clarity, and logical structure over stylistic concerns.';
                break;
            case this.dimensions.PERSUASIVE:
                dimensionInstruction = 'Use persuasive language designed to convince the reader. Include compelling arguments, rhetorical questions, and emotional appeals where appropriate.';
                break;
            case this.dimensions.CONCISE:
                dimensionInstruction = 'Be extremely concise and direct. Use the minimum number of words necessary to convey the complete information. Prioritize clarity and brevity.';
                break;
            case this.dimensions.ELABORATE:
                dimensionInstruction = 'Provide an elaborate, detailed response that explores multiple facets of the topic. Include examples, explanations, and contextual information.';
                break;
            case this.dimensions.FUTURE:
                dimensionInstruction = 'Adopt a forward-thinking perspective with modern terminology and concepts. Embrace innovative ideas and progressive viewpoints.';
                break;
            case this.dimensions.CLASSIC:
                dimensionInstruction = 'Use timeless, classic language and structure. Draw from traditional principles and established conventional wisdom in your response.';
                break;
            default:
                return prompt; // No enhancement needed
        }

        // Add dimension instruction to prompt
        return `${prompt}\n\n[Writing Style: ${dimensionInstruction}]`;
    }

    /**
     * Simulate content generation for different dimensions
     * For demonstration purposes only - would be replaced by actual AI calls
     * @param {string} prompt - Enhanced prompt
     * @param {string} baseContent - Original content
     * @param {string} dimension - Target dimension
     * @returns {Promise<string>} Generated content
     */
    async simulateContentGeneration(prompt, baseContent, dimension) {
        // This would be replaced by actual AI API calls
        return new Promise(resolve => {
            setTimeout(() => {
                const baseText = baseContent || "The application of artificial intelligence in document creation represents a significant advancement in productivity tools.";

                // Simulate dimension-specific transformations
                let result;
                switch (dimension) {
                    case this.dimensions.FORMAL:
                        result = "The implementation of artificial intelligence methodologies in document composition constitutes a substantial enhancement of productivity instruments. Such advancements facilitate the expeditious creation of professional correspondence while maintaining requisite standards of quality. Furthermore, these technological innovations enable users to dedicate additional cognitive resources to higher-order conceptual endeavors.";
                        break;
                    case this.dimensions.CREATIVE:
                        result = "AI-powered words dance across the blank canvas of your document, painting thoughts in digital ink. Like a tireless muse whispering in your ear, these silicon-born assistants weave tapestries of text that mirror your intentions. They transform the mundane task of writing into a collaborative art form where human creativity and machine precision waltz together in perfect harmony.";
                        break;
                    case this.dimensions.TECHNICAL:
                        result = "The integration of NLP-based AI systems (specifically transformer models utilizing attention mechanisms) into document authoring workflows results in 78% increased output efficiency according to benchmark testing. Implementation requires client-side JavaScript execution with API token authentication and response parsing logic. Latency metrics indicate average response generation times of 850ms for standard prompts with linear scaling relative to token count.";
                        break;
                    case this.dimensions.PERSUASIVE:
                        result = "Imagine reclaiming hours of your workday while producing better documents than ever before. That's the reality AI writing tools deliver. Why struggle with writer's block when these powerful assistants can instantly generate exactly what you need? The most successful professionals have already embraced this technology—can you afford to fall behind? Transform your productivity today and experience the unparalleled advantage of AI-augmented writing.";
                        break;
                    case this.dimensions.CONCISE:
                        result = "AI writing tools boost productivity by automating content generation, reducing time spent on drafting, and minimizing editing needs. They generate text based on simple prompts, handle formatting, and learn from user preferences. Benefits: faster document creation, consistent quality, and enhanced focus on strategic tasks.";
                        break;
                    case this.dimensions.ELABORATE:
                        result = "Artificial intelligence writing assistance represents a revolutionary paradigm shift in document creation methodologies. This technology encompasses multiple sophisticated components working in concert: natural language processing algorithms that parse and understand human prompts; content generation systems that produce semantically coherent and contextually appropriate text; adaptive learning mechanisms that internalize user preferences and writing styles; and quality assurance protocols that ensure grammatical correctness and stylistic consistency. The implementation of these systems within productivity applications offers multifaceted benefits including accelerated document drafting, cognitive load reduction, linguistic enhancement for non-native speakers, and stylistic versatility across different communication contexts. Moreover, continuous improvements in underlying machine learning models consistently expand capabilities toward increasingly nuanced understanding of subtle communicative requirements.";
                        break;
                    case this.dimensions.FUTURE:
                        result = "Next-gen AI writing interfaces now leverage thought-prediction algorithms and neural-symbolic reasoning to transform intention into expression with unprecedented fidelity. As multi-modal learning becomes standard, these systems don't just react to explicit prompts—they proactively analyze contextual factors, anticipate conceptual direction, and generate content that exceeds the user's unarticulated vision. With quantum-accelerated language models processing in real-time, the traditional boundaries between ideation and creation continue dissolving into a seamless cognitive partnership between human and machine intelligence.";
                        break;
                    case this.dimensions.CLASSIC:
                        result = "The judicious application of mechanical thinking aids in the composition of written works proves a worthy addition to the modern scribe's arsenal. Such tools, when employed with proper discretion, may indeed enhance one's literary productivity while maintaining the essential human qualities of expression. One must remember, however, that these contrivances serve as assistants rather than replacements for careful thought and measured articulation, those timeless virtues of proper correspondence which no mechanism may fully supplant.";
                        break;
                    default:
                        result = baseText;
                }

                resolve(result);
            }, 1000); // Simulate API delay
        });
    }

    /**
     * Analyze universe characteristics and extract key features
     * @param {string} content - Universe content
     * @param {string} dimension - Universe dimension
     * @returns {Object} Characteristics analysis
     */
    analyzeUniverseCharacteristics(content, dimension) {
        // Calculate word count
        const wordCount = content.split(/\s+/).length;

        // Calculate average sentence length
        const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
        const avgSentenceLength = sentences.length > 0
            ? wordCount / sentences.length
            : wordCount;

        // Calculate complexity score (basic approximation)
        const longWords = content.split(/\s+/).filter(word => word.length > 6).length;
        const complexityScore = (longWords / wordCount) * 10 + (avgSentenceLength / 10);

        // Calculate sentiment (very simple approximation)
        const positiveWords = ['advantage', 'benefit', 'enhance', 'improve', 'gain', 'positive', 'success'];
        const negativeWords = ['challenge', 'difficult', 'problem', 'risk', 'threat', 'negative', 'fail'];

        let sentimentScore = 0;
        const lowerContent = content.toLowerCase();

        positiveWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerContent.match(regex) || [];
            sentimentScore += matches.length;
        });

        negativeWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerContent.match(regex) || [];
            sentimentScore -= matches.length;
        });

        // Calculate dimension alignment (how well it matches its intended dimension)
        let dimensionAlignment = 0.7; // Base value

        // Add dimension-specific analysis
        switch (dimension) {
            case this.dimensions.FORMAL:
                // Check for formal indicators like complex words and longer sentences
                dimensionAlignment += complexityScore > 7 ? 0.2 : 0;
                dimensionAlignment += avgSentenceLength > 15 ? 0.1 : 0;
                break;
            case this.dimensions.CREATIVE:
                // Look for unusual word combinations and metaphors (simplified approximation)
                const rareCombinations = content.match(/\w+ing\s+\w+ly|\w+\s+like\s+a\s+\w+|\w+\s+of\s+\w+/g) || [];
                dimensionAlignment += rareCombinations.length > 3 ? 0.3 : 0.1;
                break;
            case this.dimensions.CONCISE:
                // Check for brevity
                dimensionAlignment += wordCount < 100 ? 0.3 : 0;
                dimensionAlignment += avgSentenceLength < 12 ? 0.2 : 0;
                break;
            // Additional dimension-specific analyses would go here
        }

        // Ensure alignment is within bounds
        dimensionAlignment = Math.min(1, Math.max(0, dimensionAlignment));

        return {
            wordCount,
            avgSentenceLength,
            complexityScore,
            sentimentScore,
            dimensionAlignment,
            timestamp: Date.now()
        };
    }

    /**
     * Select a specific universe
     * @param {string} universeId - Universe ID to select
     * @returns {Object|null} Selected universe or null if not found
     */
    selectUniverse(universeId) {
        if (this.activeUniverses[universeId]) {
            this.selectedUniverse = universeId;

            // Update metadata
            if (this.universeMetadata[universeId]) {
                this.universeMetadata[universeId].viewCount++;
                this.universeMetadata[universeId].lastViewed = Date.now();
            }

            // Save state
            this.saveState();

            // Trigger event
            if (this.events.onUniverseSelected) {
                this.events.onUniverseSelected(this.activeUniverses[universeId]);
            }

            return this.activeUniverses[universeId];
        }
        return null;
    }

    /**
     * Get all universes in a group
     * @param {string} groupId - Universe group ID
     * @returns {Object} Group universes
     */
    getUniverseGroup(groupId) {
        const groupUniverses = {};

        Object.entries(this.activeUniverses).forEach(([id, universe]) => {
            if (universe.groupId === groupId) {
                groupUniverses[id] = universe;
            }
        });

        return groupUniverses;
    }

    /**
     * Merge content from multiple universes
     * @param {string[]} universeIds - IDs of universes to merge
     * @param {number[]} weights - Weights for each universe (optional)
     * @returns {Object} Merged universe
     */
    async mergeUniverses(universeIds, weights = null) {
        // Validate universes exist
        const validUniverses = universeIds.filter(id => this.activeUniverses[id]);
        if (validUniverses.length < 2) {
            throw new Error('At least two valid universes are required for merging');
        }

        // If no weights provided, use equal weights
        const mergeWeights = weights || validUniverses.map(() => 1);

        // Normalize weights
        const totalWeight = mergeWeights.reduce((sum, w) => sum + w, 0);
        const normalizedWeights = mergeWeights.map(w => w / totalWeight);

        // Create merge visualization data for UI
        const mergeData = validUniverses.map((id, index) => ({
            universeId: id,
            dimension: this.activeUniverses[id].dimension,
            weight: normalizedWeights[index],
            content: this.activeUniverses[id].content
        }));

        // Use mergeData for visualization and processing
        if (this.visualComponents.mergeControls) {
            this.visualComponents.mergeControls.updateData(mergeData);
        }

        // In a real implementation, this would use AI to intelligently merge content
        // For now, we'll use a placeholder approach
        const segmentSize = 3; // Number of sentences per segment
        const mergedContent = await this.api.generateText(
            `Merge these ${validUniverses.length} text variants into one cohesive version that takes the best elements from each:

${validUniverses.map((universe, i) =>
                `Version ${i + 1} (${universe.dimension}): ${universe.content}`).join('\n\n')}`
        );

        // Create a new universe for the merged content
        const primaryUniverse = this.activeUniverses[validUniverses[0]];
        const mergedId = `merged_${Date.now()}`;
        const mergedUniverse = {
            id: mergedId,
            groupId: primaryUniverse.groupId,
            dimension: 'merged',
            content: mergedContent,
            prompt: primaryUniverse.originalPrompt,
            originalPrompt: primaryUniverse.originalPrompt,
            timestamp: new Date().toISOString(),
            parentUniverses: validUniverses.map(id => ({
                id,
                dimension: this.activeUniverses[id].dimension,
                weight: normalizedWeights[validUniverses.indexOf(id)]
            }))
        };

        // Add to active universes
        this.activeUniverses[mergedId] = mergedUniverse;

        // Add metadata
        this.universeMetadata[mergedId] = {
            dimension: 'merged',
            creationTime: Date.now(),
            mergeTime: Date.now(),
            viewCount: 0,
            mergeCount: 0,
            mergeData: {
                sourceUniverses: validUniverses,
                weights: normalizedWeights,
                segmentSize
            },
            characteristics: this.analyzeUniverseCharacteristics(mergedContent, 'merged')
        };

        // Update source universe metadata
        validUniverses.forEach(id => {
            if (this.universeMetadata[id]) {
                this.universeMetadata[id].mergeCount++;
                this.universeMetadata[id].lastMerged = Date.now();
            }
        });

        // Save state
        this.saveState();

        // Trigger event
        if (this.events.onUniversesMerged) {
            this.events.onUniversesMerged(mergedUniverse);
        }

        return mergedUniverse;
    }

    /**
     * Simulate merging content across universes
     * @param {Object[]} mergeData - Data about universes to merge
     * @param {number} segmentSize - Number of sentences per segment
     * @returns {string} Merged content
     */
    simulateMergedContent(mergeData, segmentSize) {
        // Extract sentences from each universe
        const universeSentences = mergeData.map(universe => {
            const sentences = universe.content.match(/[^.!?]+[.!?]+/g) || [];
            return {
                sentences,
                dimension: universe.dimension,
                weight: universe.weight
            };
        });

        // Find universe with most sentences to determine output length
        const maxSentences = Math.max(...universeSentences.map(u => u.sentences.length));

        // Create merged content by alternating between universes
        // with frequency proportional to their weights
        let mergedSentences = [];
        let currentSegment = [];

        for (let i = 0; i < maxSentences; i++) {
            // Select universe for this sentence based on weights and position
            const universeIndex = this.selectUniverseByWeightAndPosition(
                universeSentences.map(u => u.weight),
                i / maxSentences
            );

            // Get sentence from selected universe (if available)
            if (universeIndex !== -1 && i < universeSentences[universeIndex].sentences.length) {
                currentSegment.push(universeSentences[universeIndex].sentences[i]);

                // When segment is complete, add to merged sentences
                if (currentSegment.length >= segmentSize) {
                    mergedSentences = [...mergedSentences, ...currentSegment];
                    currentSegment = [];
                }
            }
        }

        // Add any remaining sentences
        if (currentSegment.length > 0) {
            mergedSentences = [...mergedSentences, ...currentSegment];
        }

        return mergedSentences.join(' ');
    }

    /**
     * Select universe based on weights and position
     * @param {number[]} weights - Universe weights
     * @param {number} position - Position (0-1) through the content
     * @returns {number} Selected universe index
     */
    selectUniverseByWeightAndPosition(weights, position) {
        if (weights.length === 0) return -1;
        if (weights.length === 1) return 0;

        // Add some variance based on position (creates smoother transitions)
        const positionAdjustedWeights = weights.map((weight, index) => {
            // Create a sine wave pattern that peaks at different positions for each universe
            const phaseShift = index / weights.length;
            const positionFactor = 0.5 + 0.5 * Math.sin(2 * Math.PI * (position + phaseShift));
            return weight * (0.7 + 0.3 * positionFactor);
        });

        // Add some randomness (quantum uncertainty)
        const randomizedWeights = positionAdjustedWeights.map(weight =>
            weight * (1 + (Math.random() * 2 - 1) * this.config.quantumUncertainty)
        );

        // Normalize weights
        const totalWeight = randomizedWeights.reduce((sum, w) => sum + w, 0);
        const normalizedWeights = randomizedWeights.map(w => w / totalWeight);

        // Select based on cumulative probability
        const random = Math.random();
        let cumulativeWeight = 0;

        for (let i = 0; i < normalizedWeights.length; i++) {
            cumulativeWeight += normalizedWeights[i];
            if (random <= cumulativeWeight) {
                return i;
            }
        }

        return normalizedWeights.length - 1;
    }

    /**
     * Create visualization of multiverse for UI display
     * @param {string} targetElementId - ID of container element
     * @param {string} groupId - Universe group ID to visualize
     * @returns {HTMLElement} Visualization element
     */
    createMultiverseVisualization(targetElementId, groupId) {
        // Get container element
        const container = document.getElementById(targetElementId);
        if (!container) {
            console.error('Target container not found');
            return null;
        }

        // Clear container
        container.innerHTML = '';

        // Get universes in group
        const universes = this.getUniverseGroup(groupId);
        const universeIds = Object.keys(universes);

        // Create visualization container
        const visContainer = document.createElement('div');
        visContainer.className = 'multiverse-visualization';
        visContainer.style.position = 'relative';
        visContainer.style.width = '100%';
        visContainer.style.height = '400px';
        visContainer.style.backgroundColor = '#f5f5f5';
        visContainer.style.borderRadius = '8px';
        visContainer.style.padding = '16px';
        visContainer.style.boxSizing = 'border-box';
        visContainer.style.overflow = 'hidden';

        // Create universe nodes
        universeIds.forEach((id, index) => {
            const universe = universes[id];
            const dimension = universe.dimension;

            // Calculate position (in a circular arrangement)
            const angle = (2 * Math.PI * index) / universeIds.length;
            const radius = Math.min(container.clientWidth, container.clientHeight) * 0.35;
            const x = Math.cos(angle) * radius + radius;
            const y = Math.sin(angle) * radius + radius;

            // Create node
            const node = document.createElement('div');
            node.className = 'universe-node';
            node.dataset.universeId = id;
            node.style.position = 'absolute';
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            node.style.width = '60px';
            node.style.height = '60px';
            node.style.borderRadius = '50%';
            node.style.backgroundColor = this.universeColors[dimension] || '#999';
            node.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            node.style.display = 'flex';
            node.style.alignItems = 'center';
            node.style.justifyContent = 'center';
            node.style.color = '#fff';
            node.style.fontWeight = 'bold';
            node.style.cursor = 'pointer';
            node.style.transition = 'transform 0.2s ease-out';
            node.style.zIndex = '1';
            node.style.fontSize = '12px';

            // Add dimension label
            node.textContent = dimension.substr(0, 4);

            // Add hover effect
            node.addEventListener('mouseenter', () => {
                node.style.transform = 'scale(1.1)';
            });

            node.addEventListener('mouseleave', () => {
                node.style.transform = 'scale(1)';
            });

            // Add click handler
            node.addEventListener('click', () => {
                this.selectUniverse(id);
            });

            visContainer.appendChild(node);

            // Add dimension bridges (connections between compatible universes)
            this.dimensionalBridges.forEach(bridge => {
                if (dimension === bridge.source) {
                    // Find target universe
                    const targetUniverse = universeIds.find(uid =>
                        universes[uid].dimension === bridge.target
                    );

                    if (targetUniverse) {
                        const targetIndex = universeIds.indexOf(targetUniverse);
                        const targetAngle = (2 * Math.PI * targetIndex) / universeIds.length;
                        const targetX = Math.cos(targetAngle) * radius + radius;
                        const targetY = Math.sin(targetAngle) * radius + radius;

                        // Create bridge line
                        const bridgeLine = document.createElement('div');
                        bridgeLine.className = 'dimension-bridge';
                        bridgeLine.style.position = 'absolute';
                        bridgeLine.style.left = `${Math.min(x, targetX) + 30}px`;
                        bridgeLine.style.top = `${Math.min(y, targetY) + 30}px`;
                        bridgeLine.style.width = `${Math.abs(x - targetX)}px`;
                        bridgeLine.style.height = `${Math.abs(y - targetY)}px`;
                        bridgeLine.style.border = `2px dashed ${this.universeColors[bridge.source]}`;
                        bridgeLine.style.zIndex = '0';

                        visContainer.appendChild(bridgeLine);
                    }
                }
            });
        });

        container.appendChild(visContainer);

        // Trigger event
        if (this.events.onVisualizationReady) {
            this.events.onVisualizationReady(visContainer);
        }

        return visContainer;
    }
}